import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { Env } from '@quickjob/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AuthService } from './auth.service';

const CONFIG_VALUES: Record<string, string> = {
  JWT_ACCESS_SECRET: 'access-secret-at-least-32-characters-long',
  JWT_REFRESH_SECRET: 'refresh-secret-at-least-32-characters-long',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
};

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let jwtService: Pick<JwtService, 'signAsync'>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    const configService = {
      get: (key: string) => CONFIG_VALUES[key],
    } as unknown as ConfigService<Env, true>;

    service = new AuthService(prisma, jwtService as JwtService, configService);
  });

  describe('register', () => {
    it('creates a user and returns a token pair', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        roles: [UserRole.WORKER],
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt-1' });

      const result = await service.register({
        email: 'jane@example.com',
        password: 'S3cur3-Passphrase',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toHaveLength(64);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'jane@example.com', roles: [UserRole.WORKER] }),
        }),
      );
    });

    it('rejects a duplicate email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'jane@example.com', password: 'S3cur3-Passphrase' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns a token pair for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('S3cur3-Passphrase', 4);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        passwordHash,
        roles: [UserRole.WORKER],
        deletedAt: null,
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt-1' });

      const result = await service.login({
        email: 'jane@example.com',
        password: 'S3cur3-Passphrase',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
    });

    it('rejects an unknown email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        passwordHash,
        roles: [UserRole.WORKER],
        deletedAt: null,
      });

      await expect(
        service.login({ email: 'jane@example.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('revokes the whole chain and throws on token reuse', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100_000),
      });

      await expect(service.refresh('some-refresh-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', revokedAt: null } }),
      );
    });

    it('rotates the token when valid', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        roles: [UserRole.WORKER],
        status: UserStatus.ACTIVE,
        deletedAt: null,
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt-2' });

      const result = await service.refresh('some-refresh-token');

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt-1' } }),
      );
    });
  });
});
