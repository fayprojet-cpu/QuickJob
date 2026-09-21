import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Job, JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { PaginatedJobsResponseDto } from './dto/job.response.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';

const EDITABLE_STATUSES: JobStatus[] = [JobStatus.DRAFT, JobStatus.PUBLISHED];

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(recruiterId: string, dto: CreateJobDto): Promise<Job> {
    return this.prisma.job.create({
      data: {
        recruiterId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        salaryAmount: dto.salaryAmount !== undefined ? BigInt(dto.salaryAmount) : null,
        salaryCurrency: dto.salaryCurrency ?? null,
        salaryType: dto.salaryType,
        durationMinutes: dto.durationMinutes,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        urgency: dto.urgency,
        workersNeeded: dto.workersNeeded,
        recurrence: dto.recurrence,
        latitude: dto.latitude,
        longitude: dto.longitude,
        addressText: dto.addressText,
        city: dto.city,
        countryCode: dto.countryCode,
        status: JobStatus.DRAFT,
      },
    });
  }

  async findPublished(query: QueryJobsDto): Promise<PaginatedJobsResponseDto> {
    const where: Prisma.JobWhereInput = {
      status: JobStatus.PUBLISHED,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.countryCode ? { countryCode: query.countryCode } : {}),
      ...(query.city ? { city: { equals: query.city, mode: 'insensitive' } } : {}),
      ...(query.urgency ? { urgency: query.urgency } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    return this.paginate(where, query, { publishedAt: 'desc' });
  }

  async findMine(recruiterId: string, query: QueryJobsDto): Promise<PaginatedJobsResponseDto> {
    return this.paginate({ recruiterId }, query, { createdAt: 'desc' });
  }

  async findOnePublished(id: string): Promise<Job> {
    const job = await this.prisma.job.findFirst({
      where: { id, status: JobStatus.PUBLISHED },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async update(id: string, recruiterId: string, dto: UpdateJobDto): Promise<Job> {
    const job = await this.getOwnedEditableJob(id, recruiterId);

    return this.prisma.job.update({
      where: { id: job.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.salaryAmount !== undefined ? { salaryAmount: BigInt(dto.salaryAmount) } : {}),
        ...(dto.salaryCurrency !== undefined ? { salaryCurrency: dto.salaryCurrency } : {}),
        ...(dto.salaryType !== undefined ? { salaryType: dto.salaryType } : {}),
        ...(dto.durationMinutes !== undefined ? { durationMinutes: dto.durationMinutes } : {}),
        ...(dto.startAt !== undefined ? { startAt: new Date(dto.startAt) } : {}),
        ...(dto.urgency !== undefined ? { urgency: dto.urgency } : {}),
        ...(dto.workersNeeded !== undefined ? { workersNeeded: dto.workersNeeded } : {}),
        ...(dto.recurrence !== undefined ? { recurrence: dto.recurrence } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.addressText !== undefined ? { addressText: dto.addressText } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.countryCode !== undefined ? { countryCode: dto.countryCode } : {}),
      },
    });
  }

  async publish(id: string, recruiterId: string): Promise<Job> {
    const job = await this.getOwnedJob(id, recruiterId);
    if (job.status !== JobStatus.DRAFT) {
      throw new BadRequestException('Only a DRAFT job can be published');
    }
    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async cancel(id: string, recruiterId: string): Promise<void> {
    const job = await this.getOwnedJob(id, recruiterId);

    if (job.status === JobStatus.DRAFT) {
      await this.prisma.job.delete({ where: { id: job.id } });
      return;
    }
    if (job.status === JobStatus.PUBLISHED) {
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.CANCELLED },
      });
      return;
    }
    throw new BadRequestException(`A job with status ${job.status} cannot be cancelled`);
  }

  private async paginate(
    where: Prisma.JobWhereInput,
    query: QueryJobsDto,
    orderBy: Prisma.JobOrderByWithRelationInput,
  ): Promise<PaginatedJobsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Charge une mission en vérifiant l'appartenance. Renvoie 404 (et non 403)
   * si elle n'appartient pas au recruteur, pour ne pas révéler son existence.
   */
  private async getOwnedJob(id: string, recruiterId: string): Promise<Job> {
    const job = await this.prisma.job.findFirst({ where: { id, recruiterId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  private async getOwnedEditableJob(id: string, recruiterId: string): Promise<Job> {
    const job = await this.getOwnedJob(id, recruiterId);
    if (!EDITABLE_STATUSES.includes(job.status)) {
      throw new BadRequestException(`A job with status ${job.status} cannot be edited`);
    }
    return job;
  }
}
