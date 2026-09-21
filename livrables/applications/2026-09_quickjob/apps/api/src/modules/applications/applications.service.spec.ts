import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, JobStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ApplicationsService } from './applications.service';

function buildPrismaMock() {
  return {
    job: {
      findFirst: jest.fn(),
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

const baseJob = {
  id: 'job-1',
  recruiterId: 'recruiter-1',
  status: JobStatus.PUBLISHED,
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
};

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new ApplicationsService(prisma);
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
    });
  });
});
