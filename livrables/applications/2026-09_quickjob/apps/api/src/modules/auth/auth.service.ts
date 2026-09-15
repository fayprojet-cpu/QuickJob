import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { Env } from '@quickjob/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { asJwtDuration, parseDurationMs } from './utils/parse-duration.util';
import { generateRefreshToken, hashRefreshToken } from './utils/refresh-token.util';
import { JwtPayload } from './strategies/jwt-payload.interface';

const BCRYPT_SALT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RequestContext {
  deviceInfo?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto, context: RequestContext = {}): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        roles: dto.roles && dto.roles.length > 0 ? dto.roles : [UserRole.WORKER],
        locale: dto.locale ?? 'en',
        countryCode: dto.countryCode,
      },
      select: { id: true, roles: true },
    });

    return this.issueTokenPair(user.id, user.roles, context);
  }

  async login(dto: LoginDto, context: RequestContext = {}): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPair(user.id, user.roles, context);
  }

  async refresh(refreshToken: string, context: RequestContext = {}): Promise<TokenPair> {
    const tokenHash = hashRefreshToken(
      refreshToken,
      this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
    );

    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt || existing.expiresAt < new Date()) {
      // Rejeu d'un token déjà utilisé/expiré : on révoque toute la chaîne active
      // de l'utilisateur par précaution (signal probable de vol de token).
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const user = await this.prisma.user.findUnique({ where: { id: existing.userId } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const pair = await this.issueTokenPair(user.id, user.roles, context, existing.id);

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return pair;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(
      refreshToken,
      this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
    );
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokenPair(
    userId: string,
    roles: UserRole[],
    context: RequestContext,
    replacesTokenId?: string,
  ): Promise<TokenPair> {
    const accessTtl = this.configService.get('JWT_ACCESS_TTL', { infer: true });
    const refreshTtl = this.configService.get('JWT_REFRESH_TTL', { infer: true });

    const payload: JwtPayload = { sub: userId, roles };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: asJwtDuration(accessTtl),
    });

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(
      refreshToken,
      this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
    );
    const expiresAt = new Date(Date.now() + parseDurationMs(refreshTtl));

    const created = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        deviceInfo: context.deviceInfo,
        ipAddress: context.ipAddress,
      },
      select: { id: true },
    });

    if (replacesTokenId) {
      await this.prisma.refreshToken.update({
        where: { id: replacesTokenId },
        data: { replacedByTokenId: created.id },
      });
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(parseDurationMs(accessTtl) / 1000),
    };
  }
}
