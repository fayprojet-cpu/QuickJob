import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Application, ApplicationStatus, JobStatus, Prisma } from '@prisma/client';
import { Env } from '@quickjob/config';
import { MailService } from '../../infra/mail/mail.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ApplyToJobDto } from './dto/apply-to-job.dto';

type PrismaTx = Prisma.TransactionClient;

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
      include: { worker: { select: { id: true, email: true, firstName: true, avatarUrl: true, phone: true } } },
    });
  }

  async findMine(workerId: string): Promise<Application[]> {
    return this.prisma.application.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { id: true, title: true, city: true, countryCode: true, status: true } },
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

    const updated =
      status === ApplicationStatus.ACCEPTED
        ? await this.prisma.$transaction((tx) =>
            this.activateMission(tx, {
              applicationId: id,
              jobId: application.jobId,
              recruiterId,
              workerId: application.workerId,
              fromJobStatuses: [JobStatus.PUBLISHED],
            }),
          )
        : await this.prisma.application.update({
            where: { id },
            data: { status, decidedAt: new Date() },
          });

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

  /**
   * Le recruteur invite directement un travailleur avec qui il a déjà
   * travaillé (mission déjà terminée entre eux), sur une nouvelle mission —
   * sans attendre de candidatures publiques. La mission peut rester en
   * brouillon (jamais publiée) le temps que le travailleur réponde.
   */
  async invite(jobId: string, recruiterId: string, workerId: string): Promise<Application> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, recruiterId, status: { in: [JobStatus.DRAFT, JobStatus.PUBLISHED] } },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const hasWorkedTogether = await this.prisma.application.findFirst({
      where: {
        workerId,
        status: ApplicationStatus.ACCEPTED,
        job: { recruiterId, status: JobStatus.COMPLETED },
      },
    });
    if (!hasWorkedTogether) {
      throw new ForbiddenException('You can only invite someone you have already worked with');
    }

    const existing = await this.prisma.application.findUnique({ where: { jobId_workerId: { jobId, workerId } } });
    if (existing) {
      throw new ConflictException('This worker has already applied or been invited to this job');
    }

    return this.prisma.application.create({
      data: { jobId, workerId, invitedByRecruiter: true },
    });
  }

  /**
   * Le travailleur répond à une invitation directe — c'est lui, pas le
   * recruteur, qui accepte/refuse ici (inverse du flux normal de
   * candidature), puisque c'est le recruteur qui a pris l'initiative.
   */
  async respondToInvite(id: string, workerId: string, accept: boolean): Promise<Application> {
    const application = await this.prisma.application.findFirst({
      where: { id, workerId, invitedByRecruiter: true },
      include: { job: { select: { id: true, recruiterId: true } } },
    });
    if (!application) {
      throw new NotFoundException('Invitation not found');
    }
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(`This invitation has already been decided (${application.status})`);
    }

    if (!accept) {
      return this.prisma.application.update({
        where: { id },
        data: { status: ApplicationStatus.REJECTED, decidedAt: new Date() },
      });
    }

    return this.prisma.$transaction((tx) =>
      this.activateMission(tx, {
        applicationId: id,
        jobId: application.jobId,
        recruiterId: application.job.recruiterId,
        workerId,
        fromJobStatuses: [JobStatus.DRAFT, JobStatus.PUBLISHED],
      }),
    );
  }

  /**
   * Marque une candidature ACCEPTÉE, démarre la mission et ouvre la
   * conversation recruteur/travailleur — partagé entre l'acceptation
   * normale (recruteur choisit un candidat) et l'acceptation d'une
   * invitation (travailleur accepte une invitation directe).
   */
  private async activateMission(
    tx: PrismaTx,
    input: { applicationId: string; jobId: string; recruiterId: string; workerId: string; fromJobStatuses: JobStatus[] },
  ): Promise<Application> {
    const [updated] = await Promise.all([
      tx.application.update({
        where: { id: input.applicationId },
        data: { status: ApplicationStatus.ACCEPTED, decidedAt: new Date() },
      }),
      // updateMany conditionnel : sans effet si la mission est déjà en cours
      // (cas de plusieurs travailleurs recherchés, ou double appel concurrent).
      tx.job.updateMany({
        where: { id: input.jobId, status: { in: input.fromJobStatuses } },
        data: { status: JobStatus.IN_PROGRESS },
      }),
    ]);

    // Conversation liée 1:1 à la mission (jobId unique) -> upsert idempotent,
    // pas de doublon si un autre travailleur est aussi accepté sur la même mission.
    const conversation = await tx.conversation.upsert({
      where: { jobId: input.jobId },
      create: { jobId: input.jobId },
      update: {},
    });

    await Promise.all(
      [input.recruiterId, input.workerId].map((userId) =>
        tx.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId: conversation.id, userId } },
          create: { conversationId: conversation.id, userId },
          update: {},
        }),
      ),
    );

    return updated;
  }
}
