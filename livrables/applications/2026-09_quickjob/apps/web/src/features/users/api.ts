import { authApiFetch } from '@/lib/auth-api-client';
import type { AuthUser, SelfServiceRole } from '@/types/api';

export function addRole(role: SelfServiceRole): Promise<AuthUser> {
  return authApiFetch<AuthUser>('/users/me/roles', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}
