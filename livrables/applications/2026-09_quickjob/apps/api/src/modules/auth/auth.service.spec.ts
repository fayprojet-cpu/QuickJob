import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { Env } from '@quickjob/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { MailService } from '../../infra/mail/mail.service';
import { AuthService } from './auth.service';

const CONFIG_VALUES: Record<string, string> = {
  JWT_ACCESS_SECRET: 'access-secret-at-least-32-characters-long',
  JWT_REFRESH_SECRET: 'refresh-secret-at-least-32-characters-long',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  WEB_URL: 'http://localhost:3000',
};

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  } as unknown as PrismaService;
}

function buildMailServiceMock() {
  return { sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined) } as unknown as MailService;
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let mailService: ReturnType<typeof buildMailServiceMock>;
  let jwtService: Pick<JwtService, 'signAsync'>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    mailService = buildMailServiceMock();
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    const configService = {
      get: (key: string) => CONFIG_VALUES[key],
    } as unknown as ConfigService<Env, true>;

    service = new AuthService(prisma, jwtService as JwtService, configService, mailService);
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

  describe('forgotPassword', () => {
    it('creates a reset token and sends an email when the account exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'jane@example.com',
        locale: 'fr',
        deletedAt: null,
      });
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({ id: 'prt-1' });

      await service.forgotPassword({ email: 'jane@example.com' });

      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }),
      );
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'jane@example.com',
        expect.stringContaining('http://localhost:3000/reset-password?token='),
        'fr',
      );
    });

    it('silently does nothing when the email is unknown', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.forgotPassword({ email: 'ghost@example.com' })).resolves.toBeUndefined();

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('updates the password, marks the token used and revokes refresh tokens', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (prisma.passwordResetToken.update as jest.Mock).mockResolvedValue({ id: 'prt-1' });
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      await service.resetPassword({ token: 'some-reset-token', newPassword: 'N3w-Passphrase' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'prt-1' }, data: { usedAt: expect.any(Date) } }),
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', revokedAt: null } }),
      );
    });

    it('rejects an unknown token', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'nope', newPassword: 'N3w-Passphrase' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an expired token', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1_000),
      });

      await expect(
        service.resetPassword({ token: 'expired', newPassword: 'N3w-Passphrase' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an already-used token', async () => {
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 100_000),
      });

      await expect(
        service.resetPassword({ token: 'already-used', newPassword: 'N3w-Passphrase' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
