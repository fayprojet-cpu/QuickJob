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
  firstName: string | null;
  avatarUrl: string | null;
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
  firstName: string;
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
  /** Absent = rémunération à négocier. */
  salaryAmount: string | null;
  salaryCurrency: string | null;
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

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  decisionMessage: string | null;
  createdAt: string;
  decidedAt: string | null;
  /** true si créée par le recruteur (réinvitation) plutôt que par le travailleur. */
  invitedByRecruiter: boolean;
  /** Présent uniquement sur la vue recruteur (GET /jobs/:jobId/applications). */
  worker?: { id: string; email: string | null; firstName: string | null; avatarUrl: string | null; phone: string | null };
  /** Présent sur la vue travailleur (GET /applications/mine) : la mission liée. */
  job?: { id: string; title: string; city: string | null; countryCode: string | null; status: JobStatus };
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

export interface UpdateUserInput {
  firstName?: string;
}

export interface CreateJobInput {
  title: string;
  description: string;
  categoryId: string;
  /** Absentes = rémunération à négocier. */
  salaryAmount?: string;
  salaryCurrency?: string;
  salaryType?: SalaryType;
  urgency?: JobUrgency;
  workersNeeded?: number;
  city?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'LOCATION' | 'SYSTEM';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  body: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  jobId: string | null;
  jobTitle: string | null;
  otherParticipant: { id: string; email: string | null; displayName: string | null; avatarUrl: string | null } | null;
  lastMessage: { body: string | null; senderId: string; createdAt: string } | null;
  unreadCount: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  authorFirstName: string | null;
  createdAt: string;
}

export interface ReviewSummary {
  /** Moyenne 1-5, null si aucun avis. */
  average: number | null;
  count: number;
  items: Review[];
}

export interface ReviewSummaryLite {
  average: number | null;
  count: number;
}

/** Un avis déjà déposé par le compte connecté — pour l'état des boutons "Noter". */
export interface AuthoredReview {
  jobId: string;
  targetId: string;
}

export interface CreateReviewInput {
  rating: number;
  comment?: string;
}

/** Profil public d'un utilisateur — visible par tous, pas seulement ses interlocuteurs. */
export interface UserProfile {
  id: string;
  firstName: string | null;
  avatarUrl: string | null;
  roles: UserRole[];
  memberSince: string;
  reviews: ReviewSummary;
  completedAsWorker: number;
  completedAsRecruiter: number;
}

export interface ActivityItem {
  jobId: string;
  jobTitle: string;
  amount: string | null;
  currency: string | null;
  completedAt: string;
  counterpart: { id: string; firstName: string | null } | null;
}

/** Historique privé complet du compte connecté — jamais exposé publiquement. */
export interface Activity {
  asWorker: ActivityItem[];
  asRecruiter: ActivityItem[];
}
