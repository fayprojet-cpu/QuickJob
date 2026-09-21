import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Application, ApplicationStatus, JobStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ApplyToJobDto } from './dto/apply-to-job.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(jobId: string, workerId: string, dto: ApplyToJobDto): Promise<Application> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, status: JobStatus.PUBLISHED },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.recruiterId === workerId) {
      throw new ForbiddenException('You cannot apply to your own job');
    }

    const existing = await this.prisma.application.findUnique({
      where: { jobId_workerId: { jobId, workerId } },
    });
    if (existing) {
      throw new ConflictException('You have already applied to this job');
    }

    return this.prisma.application.create({
      data: {
        jobId,
        workerId,
        coverLetter: dto.coverLetter,
      },
    });
  }

  async findForJob(jobId: string, recruiterId: string): Promise<Application[]> {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, recruiterId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return this.prisma.application.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: { worker: { select: { id: true, email: true, phone: true } } },
    });
  }

  async findMine(workerId: string): Promise<Application[]> {
    return this.prisma.application.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(id: string, recruiterId: string): Promise<Application> {
    return this.decide(id, recruiterId, ApplicationStatus.ACCEPTED);
  }

  async reject(id: string, recruiterId: string): Promise<Application> {
    return this.decide(id, recruiterId, ApplicationStatus.REJECTED);
  }

  private async decide(id: string, recruiterId: string, status: ApplicationStatus): Promise<Application> {
    const application = await this.prisma.application.findFirst({
      where: { id, job: { recruiterId } },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(`This application has already been decided (${application.status})`);
    }

    return this.prisma.application.update({
      where: { id },
      data: { status, decidedAt: new Date() },
    });
  }
}
