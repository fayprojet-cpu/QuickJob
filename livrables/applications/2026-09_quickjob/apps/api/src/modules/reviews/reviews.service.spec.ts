import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, JobStatus, ReviewDirection } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReviewsService } from './reviews.service';

function buildPrismaMock() {
  return {
    job: { findFirst: jest.fn() },
    application: { findFirst: jest.fn() },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    user: { update: jest.fn() },
  } as unknown as PrismaService;
}

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new ReviewsService(prisma);
    (prisma.review.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: 4 }, _count: 1 });
  });

  describe('reviewWorkerForJob', () => {
    const dto = { rating: 5, comment: 'Super travail' };

    it('creates a review from the recruiter to the accepted worker and recalculates trustScore', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({ id: 'job-1', status: JobStatus.COMPLETED });
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({ workerId: 'worker-1' });
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.review.create as jest.Mock).mockResolvedValue({
        id: 'review-1',
        rating: 5,
        comment: 'Super travail',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        author: { firstName: 'Jane' },
      });

      const result = await service.reviewWorkerForJob('job-1', 'recruiter-1', dto);

      expect(result.id).toBe('review-1');
      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobId: 'job-1',
            authorId: 'recruiter-1',
            targetId: 'worker-1',
            direction: ReviewDirection.RECRUITER_TO_WORKER,
            rating: 5,
          }),
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'worker-1' }, data: { trustScore: 80 } });
    });

    it('throws NotFoundException when the job does not belong to the recruiter', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.reviewWorkerForJob('job-1', 'someone-else', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException when the job is not COMPLETED', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({ id: 'job-1', status: JobStatus.IN_PROGRESS });

      await expect(service.reviewWorkerForJob('job-1', 'recruiter-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when there is no accepted worker to review', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({ id: 'job-1', status: JobStatus.COMPLETED });
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.reviewWorkerForJob('job-1', 'recruiter-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws ConflictException when the recruiter already reviewed this worker for this job', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({ id: 'job-1', status: JobStatus.COMPLETED });
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({ workerId: 'worker-1' });
      (prisma.review.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-review' });

      await expect(service.reviewWorkerForJob('job-1', 'recruiter-1', dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when author and target would be the same user (self-review guard)', async () => {
      (prisma.job.findFirst as jest.Mock).mockResolvedValue({ id: 'job-1', status: JobStatus.COMPLETED });
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({ workerId: 'recruiter-1' });

      await expect(service.reviewWorkerForJob('job-1', 'recruiter-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
  });

  describe('reviewRecruiterForApplication', () => {
    const dto = { rating: 4 };
    const baseApplication = {
      id: 'app-1',
      workerId: 'worker-1',
      status: ApplicationStatus.ACCEPTED,
      job: { id: 'job-1', status: JobStatus.COMPLETED, recruiterId: 'recruiter-1' },
    };

    it('creates a review from the worker to the recruiter', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(baseApplication);
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.review.create as jest.Mock).mockResolvedValue({
        id: 'review-2',
        rating: 4,
        comment: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        author: { firstName: 'Kofi' },
      });

      const result = await service.reviewRecruiterForApplication('app-1', 'worker-1', dto);

      expect(result.id).toBe('review-2');
      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobId: 'job-1',
            authorId: 'worker-1',
            targetId: 'recruiter-1',
            direction: ReviewDirection.WORKER_TO_RECRUITER,
            rating: 4,
          }),
        }),
      );
    });

    it('throws NotFoundException when the application does not belong to the worker', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.reviewRecruiterForApplication('app-1', 'someone-else', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the application was not ACCEPTED', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({
        ...baseApplication,
        status: ApplicationStatus.PENDING,
      });

      await expect(service.reviewRecruiterForApplication('app-1', 'worker-1', dto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when the job is not COMPLETED', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue({
        ...baseApplication,
        job: { ...baseApplication.job, status: JobStatus.IN_PROGRESS },
      });

      await expect(service.reviewRecruiterForApplication('app-1', 'worker-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws ConflictException on a double review', async () => {
      (prisma.application.findFirst as jest.Mock).mockResolvedValue(baseApplication);
      (prisma.review.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-review' });

      await expect(service.reviewRecruiterForApplication('app-1', 'worker-1', dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
  });

  describe('findReceivedByUser', () => {
    it('returns the average, count and recent reviews', async () => {
      (prisma.review.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: 4.5 }, _count: 2 });
      (prisma.review.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'review-1',
          rating: 5,
          comment: 'Top',
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          author: { firstName: 'Jane' },
        },
      ]);

      const result = await service.findReceivedByUser('worker-1');

      expect(result.average).toBe(4.5);
      expect(result.count).toBe(2);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({ id: 'review-1', rating: 5, authorFirstName: 'Jane' }),
      );
    });

    it('returns a null average when there are no reviews', async () => {
      (prisma.review.aggregate as jest.Mock).mockResolvedValue({ _avg: { rating: null }, _count: 0 });
      (prisma.review.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findReceivedByUser('worker-1');

      expect(result.average).toBeNull();
      expect(result.count).toBe(0);
    });
  });

  describe('findSummariesForUsers', () => {
    it('returns one entry per requested id, defaulting to null/0 when there is no review', async () => {
      (prisma.review.groupBy as jest.Mock).mockResolvedValue([
        { targetId: 'user-1', _avg: { rating: 4.5 }, _count: 2 },
      ]);

      const result = await service.findSummariesForUsers(['user-1', 'user-2']);

      expect(result).toEqual({
        'user-1': { average: 4.5, count: 2 },
        'user-2': { average: null, count: 0 },
      });
      expect(prisma.review.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ targetId: { in: ['user-1', 'user-2'] } }) }),
      );
    });

    it('returns an empty object without querying when no ids are given', async () => {
      const result = await service.findSummariesForUsers([]);

      expect(result).toEqual({});
      expect(prisma.review.groupBy).not.toHaveBeenCalled();
    });
  });
});
