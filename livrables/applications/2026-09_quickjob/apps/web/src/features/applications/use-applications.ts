'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptApplication,
  acceptInvite,
  applyToJob,
  declineInvite,
  fetchJobApplications,
  fetchMineApplications,
  inviteWorker,
  rejectApplication,
} from './api';

export function useMineApplications() {
  return useQuery({ queryKey: ['applications', 'mine'], queryFn: fetchMineApplications });
}

export function useJobApplications(jobId: string) {
  return useQuery({
    queryKey: ['applications', 'job', jobId],
    queryFn: () => fetchJobApplications(jobId),
  });
}

export function useApplyToJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (coverLetter?: string) => applyToJob(jobId, coverLetter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
  });
}

export function useAcceptApplication(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'job', jobId] });
    },
  });
}

export function useRejectApplication(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'job', jobId] });
    },
  });
}

/** Invite directement un travailleur déjà connu sur une mission (pas d'attente de candidatures). */
export function useInviteWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, workerId }: { jobId: string; workerId: string }) => inviteWorker(jobId, workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'mine'] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => declineInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
  });
}
