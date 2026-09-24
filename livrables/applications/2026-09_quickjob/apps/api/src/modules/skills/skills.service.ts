import { Injectable } from '@nestjs/common';
import { Skill } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive(): Promise<Skill[]> {
    return this.prisma.skill.findMany({
      where: { isActive: true },
      orderBy: { key: 'asc' },
    });
  }
}
