/**
 * Types miroirs des DTOs de l'API (apps/api). Dupliqués volontairement (pas
 * d'import cross-app vers @prisma/client depuis le web) : le web ne dépend
 * que de la forme JSON réellement renvoyée sur le fil (BigInt -> string).
 */

export type UserRole = 'WORKER' | 'RECRUITER' | 'ADMIN' | 'SUPER_ADMIN';
/** Rôles qu'un compte peut s'auto-attribuer — jamais ADMIN/SUPER_ADMIN. */
export type SelfServiceRole = 'WORKER' | 'RECRUITER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';

export type SalaryType = 'FIXED' | 'HOURLY' | 'DAILY';
export type JobUrgency = 'FLEXIBLE' | 'THIS_WEEK' | 'TODAY' | 'URGENT';
export type JobStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';
export type RecurrenceFrequency = 'NONE' | 'WEEKLY' | 'MONTHLY';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  roles: UserRole[];
  status: UserStatus;
  locale: string;
  currency: string;
  countryCode: string | null;
  timezone: string;
  trustScore: number;
  createdAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  roles?: Array<'WORKER' | 'RECRUITER'>;
  locale?: string;
  countryCode?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Category {
  id: string;
  key: string;
  labelKey: string;
  iconUrl: string | null;
  sortOrder: number;
}

export interface Job {
  id: string;
  recruiterId: string;
  categoryId: string;
  title: string;
  description: string;
  salaryAmount: string;
  salaryCurrency: string;
  salaryType: SalaryType;
  durationMinutes: number | null;
  startAt: string | null;
  urgency: JobUrgency;
  workersNeeded: number;
  status: JobStatus;
  recurrence: RecurrenceFrequency;
  latitude: string | null;
  longitude: string | null;
  addressText: string | null;
  city: string | null;
  countryCode: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface QueryJobsInput {
  page?: number;
  limit?: number;
  categoryId?: string;
  countryCode?: string;
  city?: string;
  urgency?: JobUrgency;
  search?: string;
}

export interface CreateJobInput {
  title: string;
  description: string;
  categoryId: string;
  salaryAmount: string;
  salaryCurrency: string;
  salaryType?: SalaryType;
  urgency?: JobUrgency;
  workersNeeded?: number;
  city?: string;
  countryCode?: string;
}
