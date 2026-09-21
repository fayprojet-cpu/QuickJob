import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Application, ApplicationStatus, JobStatus } from '@prisma/client';
import { Env } from '@quickjob/config';
import { MailService } from '../../infra/mail/mail.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ApplyToJobDto } from './dto/apply-to-job.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async apply(jobId: string, workerId: string, dto: ApplyToJobDto): Promise<Application> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, status: JobStatus.PUBLISHED },
      include: { recruiter: { select: { email: true, locale: true } } },
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

    const application = await this.prisma.application.create({
      data: {
        jobId,
        workerId,
        coverLetter: dto.coverLetter,
      },
    });

    if (job.recruiter.email) {
      const webUrl = this.configService.get('WEB_URL', { infer: true });
      // Fire-and-forget : un échec d'envoi ne doit jamais faire échouer la candidature.
      // Le .catch est une sécurité en plus du try/catch interne de MailService.
      void this.mailService
        .sendNewApplicationEmail(
          job.recruiter.email,
          job.recruiter.locale,
          job.title,
          `${webUrl}/jobs/${jobId}/applications`,
        )
        .catch(() => {});
    }

    return application;
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
      include: {
        job: { select: { id: true, title: true, city: true, countryCode: true } },
      },
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
      include: {
        job: { select: { title: true } },
        worker: { select: { email: true, locale: true } },
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(`This application has already been decided (${application.status})`);
    }

    const updateApplication = this.prisma.application.update({
      where: { id },
      data: { status, decidedAt: new Date() },
    });

    let updated: Application;
    // Accepter un candidat démarre la mission (PUBLISHED -> IN_PROGRESS), dans la
    // même transaction. updateMany conditionnel : sans effet si elle est déjà en
    // cours (cas de plusieurs travailleurs recherchés).
    if (status === ApplicationStatus.ACCEPTED) {
      const [result] = await this.prisma.$transaction([
        updateApplication,
        this.prisma.job.updateMany({
          where: { id: application.jobId, status: JobStatus.PUBLISHED },
          data: { status: JobStatus.IN_PROGRESS },
        }),
      ]);
      updated = result;
    } else {
      updated = await updateApplication;
    }

    if (application.worker.email) {
      const webUrl = this.configService.get('WEB_URL', { infer: true });
      // Fire-and-forget : un échec d'envoi ne doit jamais faire échouer la décision.
      // Le .catch est une sécurité en plus du try/catch interne de MailService.
      void this.mailService
        .sendApplicationDecisionEmail(
          application.worker.email,
          application.worker.locale,
          application.job.title,
          status === ApplicationStatus.ACCEPTED,
          `${webUrl}/applications`,
        )
        .catch(() => {});
    }

    return updated;
  }
}
