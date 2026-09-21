'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptApplication,
  applyToJob,
  fetchJobApplications,
  fetchMineApplications,
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
