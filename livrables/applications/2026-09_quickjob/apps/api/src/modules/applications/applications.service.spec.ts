import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationStatus, JobStatus } from '@prisma/client';
import { Env } from '@quickjob/config';
import { MailService } from '../../infra/mail/mail.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ApplicationsService } from './applications.service';

const CONFIG_VALUES: Record<string, string> = {
  WEB_URL: 'http://localhost:3000',
};

function buildPrismaMock() {
  return {
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
    job: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
}

function buildMailServiceMock() {
  return {
    sendNewApplicationEmail: jest.fn().mockResolvedValue(undefined),
    sendApplicationDecisionEmail: jest.fn().mockResolvedValue(undefined),
  } as unknown as MailService;
}

function buildConfigServiceMock() {
  return { get: (key: string) => CONFIG_VALUES[key] } as unknown as ConfigService<Env, true>;
}

const baseJob = {
  id: 'job-1',
  recruiterId: 'recruiter-1',
  title: 'Livraison de colis',
  status: JobStatus.PUBLISHED,
  recruiter: { email: 'recruiter@example.com', locale: 'fr' },
};

const baseApplication = {
  id: 'app-1',
  jobId: 'job-1',
  workerId: 'worker-1',
  status: ApplicationStatus.PENDING,
  coverLetter: null,
  decisionMessage: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  decidedAt: null,
  job: { title: 'Livraison de colis' },
  worker: { email: 'worker@example.com', locale: 'en' },
};

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let mailService: ReturnType<typeof buildMailServiceMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    mailService = buildMailServiceMock();
    service = new ApplicationsService(prisma, mailService, buildConfigServiceMock());
  });

  describe('apply', () => {
    it('creates an application for a published job owned by someone else', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(baseJob);
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.application.create as jest.Mock).mockResolvedValue(baseApplication);

      const result = await service.apply('job-1', 'worker-1', { coverLetter: 'Hello' });

      expect(result).toEqual(baseApplication);
      expect(prisma.application.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ jobId: 'job-1', workerId: 'worker-1' }),
        }),
      );
      // Prévient le recruteur par email (fire-and-forget).
      expect(mailService.sendNewApplicationEmail).toHaveBeenCalledWith(
        'recruiter@example.com',
        'fr',
        'Livraison de colis',
        'http://localhost:3000/jobs/job-1/applications',
      );
    });

    it('throws NotFoundException when the job is not published', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.apply('job-1', 'worker-1', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the recruiter applies to their own job', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(baseJob);

      await expect(service.apply('job-1', 'recruiter-1', {})).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws ConflictException when already applied', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(baseJob);
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(baseApplication);

      await expect(service.apply('job-1', 'worker-1', {})).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('does not fail the application when the notification email fails', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(baseJob);
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.application.create as jest.Mock).mockResolvedValue(baseApplication);
      (mailService.sendNewApplicationEmail as jest.Mock).mockRejectedValue(new Error('SMTP down'));

      await expect(service.apply('job-1', 'worker-1', {})).resolves.toEqual(baseApplication);
    });
  });

  describe('accept', () => {
    it('accepts a PENDING application owned via the job relation', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(baseApplication);
      (prisma.application.update as jest.Mock).mockResolvedValue({
        ...baseApplication,
        status: ApplicationStatus.ACCEPTED,
      });

      const result = await service.accept('app-1', 'recruiter-1');

      expect(result.status).toBe(ApplicationStatus.ACCEPTED);
      expect(prisma.application.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'app-1', job: { recruiterId: 'recruiter-1' } } }),
      );
      // Accepter démarre la mission (PUBLISHED -> IN_PROGRESS).
      expect(prisma.job.updateMany).toHaveBeenCalledWith({
        where: { id: 'job-1', status: JobStatus.PUBLISHED },
        data: { status: JobStatus.IN_PROGRESS },
      });
      // Prévient le travailleur par email (fire-and-forget), accepted = true.
      expect(mailService.sendApplicationDecisionEmail).toHaveBeenCalledWith(
        'worker@example.com',
        'en',
        'Livraison de colis',
        true,
        'http://localhost:3000/applications',
      );
    });

    it('throws NotFoundException when the application does not belong to the recruiter', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.accept('app-1', 'someone-else')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException when the application was already decided', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({
        ...baseApplication,
        status: ApplicationStatus.REJECTED,
      });

      await expect(service.accept('app-1', 'recruiter-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('does not fail the decision when the notification email fails', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(baseApplication);
      (prisma.application.update as jest.Mock).mockResolvedValue({
        ...baseApplication,
        status: ApplicationStatus.ACCEPTED,
      });
      (mailService.sendApplicationDecisionEmail as jest.Mock).mockRejectedValue(
        new Error('SMTP down'),
      );

      await expect(service.accept('app-1', 'recruiter-1')).resolves.toEqual(
        expect.objectContaining({ status: ApplicationStatus.ACCEPTED }),
      );
    });
  });

  describe('reject', () => {
    it('rejects a PENDING application', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(baseApplication);
      (prisma.application.update as jest.Mock).mockResolvedValue({
        ...baseApplication,
        status: ApplicationStatus.REJECTED,
      });

      const result = await service.reject('app-1', 'recruiter-1');

      expect(result.status).toBe(ApplicationStatus.REJECTED);
      // Refuser ne démarre PAS la mission.
      expect(prisma.job.updateMany).not.toHaveBeenCalled();
      // Prévient le travailleur par email, accepted = false.
      expect(mailService.sendApplicationDecisionEmail).toHaveBeenCalledWith(
        'worker@example.com',
        'en',
        'Livraison de colis',
        false,
        'http://localhost:3000/applications',
      );
    });
  });
});
