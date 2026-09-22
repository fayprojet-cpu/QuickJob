import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user.response.dto';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  phone: true,
  roles: true,
  status: true,
  locale: true,
  currency: true,
  countryCode: true,
  timezone: true,
  trustScore: true,
  createdAt: true,
} as const;

type SafeUser = Pick<User, keyof typeof SAFE_USER_SELECT>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findSafeById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: SAFE_USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponseDto(user);
  }

  async updateMe(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.countryCode !== undefined ? { countryCode: dto.countryCode } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      },
      select: SAFE_USER_SELECT,
    });
    return this.toResponseDto(user);
  }

  /**
   * Ajoute un rôle self-service (WORKER/RECRUITER) au compte connecté —
   * idempotent : ne duplique rien si le rôle est déjà présent. C'est le
   * mécanisme qui permet à un même compte de devenir à la fois travailleur
   * et recruteur ("bascule de mode" côté web).
   */
  async addRole(id: string, role: UserRole): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { roles: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.roles.includes(role)) {
      return this.findSafeById(id);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roles: { push: role } },
      select: SAFE_USER_SELECT,
    });
    return this.toResponseDto(updated);
  }

  private toResponseDto(user: SafeUser): UserResponseDto {
    return { ...user };
  }
}
