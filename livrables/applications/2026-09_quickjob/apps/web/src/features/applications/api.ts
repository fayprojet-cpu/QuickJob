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
