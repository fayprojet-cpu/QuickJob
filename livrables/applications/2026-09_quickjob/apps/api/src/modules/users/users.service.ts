import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ApplicationStatus, JobStatus, User, UserRole } from '@prisma/client';
import { ALLOWED_AVATAR_MIME_TYPES, StorageService } from '../../infra/storage/storage.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReviewsService } from '../reviews/reviews.service';
import { ActivityItemDto, ActivityResponseDto } from './dto/activity.response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
import { UserResponseDto } from './dto/user.response.dto';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  avatarUrl: true,
  phone: true,
  roles: true,
  status: true,
  locale: true,
  currency: true,
  countryCode: true,
  timezone: true,
  trustScore: true,
  createdAt: true,
} as const;

type SafeUser = Pick<User, keyof typeof SAFE_USER_SELECT>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly reviewsService: ReviewsService,
  ) {}

  async findSafeById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: SAFE_USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponseDto(user);
  }

  async updateMe(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.countryCode !== undefined ? { countryCode: dto.countryCode } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      },
      select: SAFE_USER_SELECT,
    });
    return this.toResponseDto(user);
  }

  /**
   * Ajoute un rôle self-service (WORKER/RECRUITER) au compte connecté —
   * idempotent : ne duplique rien si le rôle est déjà présent. C'est le
   * mécanisme qui permet à un même compte de devenir à la fois travailleur
   * et recruteur ("bascule de mode" côté web).
   */
  async addRole(id: string, role: UserRole): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { roles: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.roles.includes(role)) {
      return this.findSafeById(id);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roles: { push: role } },
      select: SAFE_USER_SELECT,
    });
    return this.toResponseDto(updated);
  }

  /** Remplace la photo de profil du compte connecté (unique, partagée entre ses rôles). */
  async updateAvatar(id: string, file: { buffer: Buffer; mimetype: string; size: number }): Promise<UserResponseDto> {
    if (!this.storageService.isConfigured()) {
      throw new ServiceUnavailableException("L'upload de photo n'est pas encore configuré");
    }
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Format d\'image non supporté (jpg, png ou webp uniquement)');
    }

    const avatarUrl = await this.storageService.uploadAvatar(id, file.buffer, file.mimetype);

    const user = await this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: SAFE_USER_SELECT,
    });
    return this.toResponseDto(user);
  }

  /** Profil public — visible sans authentification, réutilisé partout où une personne apparaît. */
  async findPublicProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, firstName: true, avatarUrl: true, roles: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [reviews, completedAsWorker, completedAsRecruiter] = await Promise.all([
      this.reviewsService.findReceivedByUser(userId),
      this.prisma.application.count({
        where: { workerId: userId, status: ApplicationStatus.ACCEPTED, job: { status: JobStatus.COMPLETED } },
      }),
      this.prisma.job.count({ where: { recruiterId: userId, status: JobStatus.COMPLETED } }),
    ]);

    return {
      id: user.id,
      firstName: user.firstName,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
      memberSince: user.createdAt,
      reviews,
      completedAsWorker,
      completedAsRecruiter,
    };
  }

  /**
   * Historique complet (missions, prix, dates) du compte connecté — jamais
   * exposé publiquement, uniquement à la personne elle-même (voir revue de
   * conception profil : le détail chiffré reste privé, seuls les chiffres
   * globaux apparaissent sur le profil public).
   */
  async findMyActivity(userId: string): Promise<ActivityResponseDto> {
    const [asWorkerApplications, asRecruiterJobs] = await Promise.all([
      this.prisma.application.findMany({
        where: { workerId: userId, status: ApplicationStatus.ACCEPTED, job: { status: JobStatus.COMPLETED } },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              salaryAmount: true,
              salaryCurrency: true,
              updatedAt: true,
              recruiter: { select: { id: true, firstName: true } },
            },
          },
        },
      }),
      this.prisma.job.findMany({
        where: { recruiterId: userId, status: JobStatus.COMPLETED },
        select: {
          id: true,
          title: true,
          salaryAmount: true,
          salaryCurrency: true,
          updatedAt: true,
          applications: {
            where: { status: ApplicationStatus.ACCEPTED },
            select: { worker: { select: { id: true, firstName: true } } },
            take: 1,
          },
        },
      }),
    ]);

    const asWorker: ActivityItemDto[] = asWorkerApplications.map((application) => ({
      jobId: application.job.id,
      jobTitle: application.job.title,
      amount: application.job.salaryAmount?.toString() ?? null,
      currency: application.job.salaryCurrency,
      completedAt: application.job.updatedAt,
      counterpart: application.job.recruiter,
    }));

    const asRecruiter: ActivityItemDto[] = asRecruiterJobs.map((job) => ({
      jobId: job.id,
      jobTitle: job.title,
      amount: job.salaryAmount?.toString() ?? null,
      currency: job.salaryCurrency,
      completedAt: job.updatedAt,
      counterpart: job.applications[0]?.worker ?? null,
    }));

    const byDateDesc = (a: ActivityItemDto, b: ActivityItemDto) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();

    return { asWorker: asWorker.sort(byDateDesc), asRecruiter: asRecruiter.sort(byDateDesc) };
  }

  private toResponseDto(user: SafeUser): UserResponseDto {
    return { ...user };
  }
}
