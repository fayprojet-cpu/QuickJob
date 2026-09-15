import { NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UsersService } from './users.service';

function buildPrismaMock() {
  return {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  const baseUser = {
    id: 'user-1',
    email: 'jane@example.com',
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
    service = new UsersService(prisma);
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
});
