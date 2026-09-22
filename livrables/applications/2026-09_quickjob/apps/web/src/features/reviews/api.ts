import { apiFetch } from '@/lib/api-client';
import { authApiFetch } from '@/lib/auth-api-client';
import type { AuthoredReview, CreateReviewInput, Review, ReviewSummary } from '@/types/api';

export function reviewWorkerForJob(jobId: string, input: CreateReviewInput): Promise<Review> {
  return authApiFetch<Review>(`/jobs/${jobId}/review`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function reviewRecruiterForApplication(applicationId: string, input: CreateReviewInput): Promise<Review> {
  return authApiFetch<Review>(`/applications/${applicationId}/review`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchMineAuthoredReviews(): Promise<AuthoredReview[]> {
  return authApiFetch<AuthoredReview[]>('/reviews/mine');
}

/** Public — pas besoin d'être connecté pour voir la réputation d'un utilisateur. */
export function fetchUserReviews(userId: string): Promise<ReviewSummary> {
  return apiFetch<ReviewSummary>(`/users/${userId}/reviews`);
}
