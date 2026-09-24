import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { StorageService } from '../../infra/storage/storage.service';
import { ReviewsService } from '../reviews/reviews.service';
import { UsersService } from './users.service';

interface TxMock {
  user: { update: jest.Mock };
  userSkill: { deleteMany: jest.Mock; createMany: jest.Mock };
}

function buildPrismaMock() {
  const tx: TxMock = {
    user: { update: jest.fn() },
    userSkill: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  return {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    userSkill: { deleteMany: jest.fn(), createMany: jest.fn() },
    application: {
      count: jest.fn().mockResolvedValue(0),
    },
    job: {
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn(async (callback: (tx: TxMock) => Promise<unknown>) => callback(tx)),
    __tx: tx,
  } as unknown as PrismaService & { __tx: TxMock };
}

function buildStorageMock() {
  return {
    isConfigured: jest.fn().mockReturnValue(true),
    uploadAvatar: jest.fn(),
  } as unknown as StorageService;
}

function buildReviewsMock() {
  return {
    findReceivedByUser: jest.fn(),
  } as unknown as ReviewsService;
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let storage: ReturnType<typeof buildStorageMock>;
  let reviews: ReturnType<typeof buildReviewsMock>;

  const baseUser = {
    id: 'user-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    avatarUrl: null,
    phone: null,
    roles: [UserRole.WORKER],
    status: UserStatus.ACTIVE,
    locale: 'en',
    currency: 'USD',
    countryCode: null,
    timezone: 'UTC',
    trustScore: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = buildPrismaMock();
    storage = buildStorageMock();
    reviews = buildReviewsMock();
    service = new UsersService(prisma, storage, reviews);
  });

  describe('findSafeById', () => {
    it('returns the safe user projection', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(baseUser);

      const result = await service.findSafeById('user-1');

      expect(result).toEqual(baseUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1', deletedAt: null } }),
      );
    });

    it('throws NotFoundException when missing or soft-deleted', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findSafeById('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateMe', () => {
    it('only forwards defined fields to Prisma', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...baseUser, locale: 'fr' });

      await service.updateMe('user-1', { locale: 'fr' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { locale: 'fr' },
        }),
      );
    });
  });

  describe('addRole', () => {
    it('appends a role the user does not have yet', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ roles: [UserRole.WORKER] });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...baseUser,
        roles: [UserRole.WORKER, UserRole.RECRUITER],
      });

      const result = await service.addRole('user-1', UserRole.RECRUITER);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { roles: { push: UserRole.RECRUITER } },
        }),
      );
      expect(result.roles).toEqual([UserRole.WORKER, UserRole.RECRUITER]);
    });

    it('is idempotent when the role is already present', async () => {
      (prisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce({ roles: [UserRole.WORKER] })
        .mockResolvedValueOnce(baseUser);

      await service.addRole('user-1', UserRole.WORKER);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.addRole('ghost', UserRole.RECRUITER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateAvatar', () => {
    const file = { buffer: Buffer.from('fake-image'), mimetype: 'image/png', size: 1024 };

    it('uploads the file and saves the resulting URL', async () => {
      (storage.uploadAvatar as jest.Mock).mockResolvedValue('https://storage.example.com/avatars/user-1.png');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://storage.example.com/avatars/user-1.png',
      });

      const result = await service.updateAvatar('user-1', file);

      expect(storage.uploadAvatar).toHaveBeenCalledWith('user-1', file.buffer, 'image/png');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { avatarUrl: 'https://storage.example.com/avatars/user-1.png' },
        }),
      );
      expect(result.avatarUrl).toBe('https://storage.example.com/avatars/user-1.png');
    });

    it('throws ServiceUnavailableException when storage is not configured', async () => {
      (storage.isConfigured as jest.Mock).mockReturnValue(false);

      await expect(service.updateAvatar('user-1', file)).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(storage.uploadAvatar).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for an unsupported mime type', async () => {
      await expect(
        service.updateAvatar('user-1', { ...file, mimetype: 'application/pdf' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.uploadAvatar).not.toHaveBeenCalled();
    });
  });

  describe('findPublicProfile', () => {
    it('combines the base identity with the review summary', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-1',
        firstName: 'Jane',
        avatarUrl: null,
        roles: [UserRole.WORKER],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      (reviews.findReceivedByUser as jest.Mock).mockResolvedValue({ average: 4.5, count: 2, items: [] });
      (prisma.application.count as jest.Mock).mockResolvedValue(3);
      (prisma.job.count as jest.Mock).mockResolvedValue(0);

      const result = await service.findPublicProfile('user-1');

      expect(result).toEqual({
        id: 'user-1',
        firstName: 'Jane',
        avatarUrl: null,
        roles: [UserRole.WORKER],
        memberSince: new Date('2026-01-01T00:00:00.000Z'),
        reviews: { average: 4.5, count: 2, items: [] },
        completedAsWorker: 3,
        completedAsRecruiter: 0,
      });
    });

    it('throws NotFoundException for a missing or soft-deleted user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findPublicProfile('ghost')).rejects.toBeInstanceOf(NotFoundException);
      expect(reviews.findReceivedByUser).not.toHaveBeenCalled();
    });
  });

  describe('findMyWorkerSettings', () => {
    it('never exposes worker settings for someone else (self only, via userId param)', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        canDoGeneral: true,
        acceptedCategoryKeys: ['category.delivery'],
        availableNow: false,
        city: 'Cotonou',
        latitude: '6.400000',
        longitude: '2.500000',
        travelRadiusKm: 10,
        skills: [{ skill: { id: 'skill-1', key: 'skill.plumbing', labelKey: 'skill.plumbing.label' } }],
      });

      const result = await service.findMyWorkerSettings('user-1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1', deletedAt: null } }),
      );
      expect(result.skills).toEqual([{ id: 'skill-1', key: 'skill.plumbing', labelKey: 'skill.plumbing.label' }]);
      expect(result.city).toBe('Cotonou');
    });

    it('throws NotFoundException for a missing or soft-deleted user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findMyWorkerSettings('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateMyWorkerSettings', () => {
    it('replaces the skill set and updates the flat fields in one transaction', async () => {
      const tx = (prisma as unknown as { __tx: TxMock }).__tx;
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        canDoGeneral: true,
        acceptedCategoryKeys: [],
        availableNow: true,
        city: 'Cotonou',
        latitude: null,
        longitude: null,
        travelRadiusKm: null,
        skills: [],
      });

      await service.updateMyWorkerSettings('user-1', {
        skillIds: ['skill-1', 'skill-2'],
        canDoGeneral: true,
        availableNow: true,
        city: 'Cotonou',
      });

      expect(tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { canDoGeneral: true, availableNow: true, city: 'Cotonou' },
        }),
      );
      expect(tx.userSkill.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(tx.userSkill.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-1', skillId: 'skill-1' },
          { userId: 'user-1', skillId: 'skill-2' },
        ],
        skipDuplicates: true,
      });
    });

    it('leaves the skill set untouched when skillIds is not provided', async () => {
      const tx = (prisma as unknown as { __tx: TxMock }).__tx;
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        canDoGeneral: false,
        acceptedCategoryKeys: [],
        availableNow: false,
        city: null,
        latitude: null,
        longitude: null,
        travelRadiusKm: null,
        skills: [],
      });

      await service.updateMyWorkerSettings('user-1', { availableNow: false });

      expect(tx.userSkill.deleteMany).not.toHaveBeenCalled();
      expect(tx.userSkill.createMany).not.toHaveBeenCalled();
    });
  });
});
