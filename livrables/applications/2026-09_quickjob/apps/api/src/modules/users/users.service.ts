import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { ALLOWED_AVATAR_MIME_TYPES, StorageService } from '../../infra/storage/storage.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReviewsService } from '../reviews/reviews.service';
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

    const reviews = await this.reviewsService.findReceivedByUser(userId);

    return {
      id: user.id,
      firstName: user.firstName,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
      memberSince: user.createdAt,
      reviews,
    };
  }

  private toResponseDto(user: SafeUser): UserResponseDto {
    return { ...user };
  }
}
