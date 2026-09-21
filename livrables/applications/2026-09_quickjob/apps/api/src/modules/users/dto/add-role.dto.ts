import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsIn } from 'class-validator';

/** Rôles qu'un utilisateur peut s'auto-attribuer — jamais ADMIN/SUPER_ADMIN. */
const SELF_SERVICE_ROLES = [UserRole.WORKER, UserRole.RECRUITER] as const;

export class AddRoleDto {
  @ApiProperty({ enum: SELF_SERVICE_ROLES, example: UserRole.RECRUITER })
  @IsIn(SELF_SERVICE_ROLES)
  role!: (typeof SELF_SERVICE_ROLES)[number];
}
