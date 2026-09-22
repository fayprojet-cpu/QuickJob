import { authApiFetch } from '@/lib/auth-api-client';
import type { AuthUser, SelfServiceRole, UpdateUserInput } from '@/types/api';

export function addRole(role: SelfServiceRole): Promise<AuthUser> {
  return authApiFetch<AuthUser>('/users/me/roles', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export function updateMe(input: UpdateUserInput): Promise<AuthUser> {
  return authApiFetch<AuthUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
