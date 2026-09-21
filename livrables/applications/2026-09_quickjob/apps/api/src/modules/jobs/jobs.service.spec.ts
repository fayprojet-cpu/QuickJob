import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobStatus, JobUrgency, RecurrenceFrequency, SalaryType } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';

function buildPrismaMock() {
  return {
    job: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;
}

const baseJob = {
  id: 'job-1',
  recruiterId: 'recruiter-1',
  categoryId: 'category-1',
  title: 'Livraison de colis',
  description: 'Livrer 10 colis dans le quartier',
  salaryAmount: 15000n,
  salaryCurrency: 'EUR',
  salaryType: SalaryType.FIXED,
  durationMinutes: null,
  startAt: null,
  urgency: JobUrgency.FLEXIBLE,
  workersNeeded: 1,
  status: JobStatus.DRAFT,
  recurrence: RecurrenceFrequency.NONE,
  latitude: null,
  longitude: null,
  addressText: null,
  city: null,
  countryCode: 'FR',
  publishedAt: null,
  expiresAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('JobsService', () => {
  let service: JobsService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new JobsService(prisma);
  });

  describe('create', () => {
    it('converts salaryAmount to BigInt and defaults status to DRAFT', async () => {
      (prisma.job.create as jest.Mock).mockResolvedValue(baseJob);

      const dto: CreateJobDto = {
        title: 'Livraison de colis',
        description: 'Livrer 10 colis dans le quartier',
        categoryId: 'category-1',
        salaryAmount: '15000',
        salaryCurrency: 'EUR',
      };

      await service.create('recruiter-1', dto);

      expect(prisma.job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            salaryAmount: 15000n,
            salaryCurrency: 'EUR',
            status: JobStatus.DRAFT,
            recruiterId: 'recruiter-1',
          }),
        }),
      );
    });

    it('creates a job without remuneration ("à négocier") when salaryAmount/salaryCurrency are absent', async () => {
      (prisma.job.create as jest.Mock).mockResolvedValue({
        ...baseJob,
        salaryAmount: null,
        salaryCurrency: null,
      });

      const dto: CreateJobDto = {
        title: 'Livraison de colis',
        description: 'Livrer 10 colis dans le quartier',
        categoryId: 'category-1',
      };

      await service.create('recruiter-1', dto);

      expect(prisma.job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            salaryAmount: null,
            salaryCurrency: null,
            status: JobStatus.DRAFT,
          }),
        }),
      );
    });
  });

  describe('findPublished', () => {
    it('paginates and filters on PUBLISHED status only', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([baseJob]);
      (prisma.job.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findPublished({ page: 2, limit: 10 });

      expect(result).toEqual({ items: [baseJob], total: 1, page: 2, limit: 10 });
      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: JobStatus.PUBLISHED }),
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the job does not belong to the recruiter', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update('job-1', 'someone-else', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects edits on a non-editable status', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({
        ...baseJob,
        status: JobStatus.COMPLETED,
      });

      await expect(service.update('job-1', 'recruiter-1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('publish', () => {
    it('publishes a DRAFT job owned by the caller', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(baseJob);
      (prisma.job.update as jest.Mock).mockResolvedValue({
        ...baseJob,
        status: JobStatus.PUBLISHED,
      });

      const result = await service.publish('job-1', 'recruiter-1');

      expect(result.status).toBe(JobStatus.PUBLISHED);
      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: JobStatus.PUBLISHED }),
        }),
      );
    });

    it('refuses to publish an already published job', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({
        ...baseJob,
        status: JobStatus.PUBLISHED,
      });

      await expect(service.publish('job-1', 'recruiter-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('complete', () => {
    it('marks an IN_PROGRESS job as COMPLETED', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({
        ...baseJob,
        status: JobStatus.IN_PROGRESS,
      });
      (prisma.job.update as jest.Mock).mockResolvedValue({
        ...baseJob,
        status: JobStatus.COMPLETED,
      });

      const result = await service.complete('job-1', 'recruiter-1');

      expect(result.status).toBe(JobStatus.COMPLETED);
      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: JobStatus.COMPLETED }),
        }),
      );
    });

    it('refuses to complete a job that is not in progress', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({
        ...baseJob,
        status: JobStatus.PUBLISHED,
      });

      await expect(service.complete('job-1', 'recruiter-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('hard-deletes a DRAFT job', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(baseJob);

      await service.cancel('job-1', 'recruiter-1');

      expect(prisma.job.delete).toHaveBeenCalledWith({ where: { id: 'job-1' } });
    });

    it('soft-cancels a PUBLISHED job', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({
        ...baseJob,
        status: JobStatus.PUBLISHED,
      });

      await service.cancel('job-1', 'recruiter-1');

      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: JobStatus.CANCELLED } }),
      );
    });

    it('refuses to cancel a COMPLETED job', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({
        ...baseJob,
        status: JobStatus.COMPLETED,
      });

      await expect(service.cancel('job-1', 'recruiter-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
