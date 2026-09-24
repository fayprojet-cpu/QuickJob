import { apiFetch } from '@/lib/api-client';
import { authApiFetch, authApiUpload } from '@/lib/auth-api-client';
import type {
  Activity,
  AuthUser,
  SelfServiceRole,
  Skill,
  UpdateUserInput,
  UpdateWorkerSettingsInput,
  UserProfile,
  WorkerSettings,
} from '@/types/api';

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

/** Privé — historique complet (missions, prix, dates) du compte connecté. */
export function fetchMyActivity(): Promise<Activity> {
  return authApiFetch<Activity>('/users/me/activity');
}

/** Public — catalogue des compétences (métiers) actives. */
export function fetchSkillsCatalog(): Promise<Skill[]> {
  return apiFetch<Skill[]>('/skills', {}, { revalidate: 300 });
}

/** Privé — profil polyvalent (compétences, missions simples, disponibilité, zone). */
export function fetchMyWorkerSettings(): Promise<WorkerSettings> {
  return authApiFetch<WorkerSettings>('/users/me/worker-settings');
}

export function updateMyWorkerSettings(input: UpdateWorkerSettingsInput): Promise<WorkerSettings> {
  return authApiFetch<WorkerSettings>('/users/me/worker-settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
