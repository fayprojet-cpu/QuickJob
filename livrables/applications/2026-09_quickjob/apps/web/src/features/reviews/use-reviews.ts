'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthoredReview, CreateReviewInput } from '@/types/api';
import {
  fetchMineAuthoredReviews,
  fetchUserReviews,
  reviewRecruiterForApplication,
  reviewWorkerForJob,
} from './api';

export function useMineAuthoredReviews() {
  return useQuery({ queryKey: ['reviews', 'mine'], queryFn: fetchMineAuthoredReviews });
}

/** Fonction pure (pas un hook) — utilisable dans une boucle .map() sans enfreindre les règles des hooks. */
export function hasReviewedJob(reviews: AuthoredReview[] | undefined, jobId: string | null | undefined): boolean {
  if (!jobId || !reviews) {
    return false;
  }
  return reviews.some((review) => review.jobId === jobId);
}

export function useUserReviews(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: () => fetchUserReviews(userId as string),
    enabled: Boolean(userId),
  });
}

/** Le recruteur note le travailleur accepté d'une mission — { jobId } passé au moment du mutate. */
export function useReviewWorkerForJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, input }: { jobId: string; input: CreateReviewInput }) => reviewWorkerForJob(jobId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'user'] });
    },
  });
}

/** Le travailleur note le recruteur, via sa candidature acceptée. */
export function useReviewRecruiterForApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, input }: { applicationId: string; input: CreateReviewInput }) =>
      reviewRecruiterForApplication(applicationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'user'] });
    },
  });
}
