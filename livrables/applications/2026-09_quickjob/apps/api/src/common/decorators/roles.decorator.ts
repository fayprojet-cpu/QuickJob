import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restreint un endpoint aux utilisateurs ayant au moins un des rôles listés. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
