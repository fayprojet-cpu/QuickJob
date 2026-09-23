import { authApiFetch } from '@/lib/auth-api-client';
import type { Application } from '@/types/api';

export function applyToJob(jobId: string, coverLetter?: string): Promise<Application> {
  return authApiFetch<Application>(`/jobs/${jobId}/applications`, {
    method: 'POST',
    body: JSON.stringify(coverLetter ? { coverLetter } : {}),
  });
}

export function fetchJobApplications(jobId: string): Promise<Application[]> {
  return authApiFetch<Application[]>(`/jobs/${jobId}/applications`);
}

export function fetchMineApplications(): Promise<Application[]> {
  return authApiFetch<Application[]>('/applications/mine');
}

export function acceptApplication(id: string): Promise<Application> {
  return authApiFetch<Application>(`/applications/${id}/accept`, { method: 'PATCH' });
}

export function rejectApplication(id: string): Promise<Application> {
  return authApiFetch<Application>(`/applications/${id}/reject`, { method: 'PATCH' });
}

/** Invite directement un travailleur déjà connu sur une mission — pas d'attente de candidatures. */
export function inviteWorker(jobId: string, workerId: string): Promise<Application> {
  return authApiFetch<Application>(`/jobs/${jobId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ workerId }),
  });
}

export function acceptInvite(id: string): Promise<Application> {
  return authApiFetch<Application>(`/applications/${id}/accept-invite`, { method: 'PATCH' });
}

export function declineInvite(id: string): Promise<Application> {
  return authApiFetch<Application>(`/applications/${id}/decline-invite`, { method: 'PATCH' });
}
