import { UserRole, UserStatus } from '@prisma/client';

/** Forme de `request.user`, attachée par la JwtStrategy après validation du token. */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  phone: string | null;
  roles: UserRole[];
  status: UserStatus;
}
