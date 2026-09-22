import { apiFetch } from '@/lib/api-client';
import { authApiFetch, authApiUpload } from '@/lib/auth-api-client';
import type { AuthUser, SelfServiceRole, UpdateUserInput, UserProfile } from '@/types/api';

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

export function uploadAvatar(file: File): Promise<AuthUser> {
  const formData = new FormData();
  formData.append('file', file);
  return authApiUpload<AuthUser>('/users/me/avatar', formData);
}

/** Public — pas besoin d'être connecté pour voir le profil d'un utilisateur. */
export function fetchUserProfile(userId: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/users/${userId}/profile`);
}
