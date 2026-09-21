import type { SelfServiceRole, UserRole } from '@/types/api';

/** Mode par défaut quand aucun n'est mémorisé : un rôle que le compte possède déjà. */
export function getDefaultMode(roles: UserRole[]): SelfServiceRole | null {
  if (roles.includes('WORKER')) return 'WORKER';
  if (roles.includes('RECRUITER')) return 'RECRUITER';
  return null;
}
