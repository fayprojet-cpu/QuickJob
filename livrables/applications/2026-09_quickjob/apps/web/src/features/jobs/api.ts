import { apiFetch, toQueryString } from '@/lib/api-client';
import { authApiFetch } from '@/lib/auth-api-client';
import type { Category, CreateJobInput, Job, PaginatedResult, QueryJobsInput } from '@/types/api';

export function fetchPublishedJobs(query: QueryJobsInput): Promise<PaginatedResult<Job>> {
  return apiFetch<PaginatedResult<Job>>(
    `/jobs${toQueryString({
      page: query.page,
      limit: query.limit,
      categoryId: query.categoryId,
      countryCode: query.countryCode,
      city: query.city,
      urgency: query.urgency,
      search: query.search,
    })}`,
    {},
    { revalidate: 30 },
  );
}

export function fetchJob(id: string): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}`, {}, { revalidate: 30 });
}

export function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/categories', {}, { revalidate: 300 });
}

export function createJob(input: CreateJobInput): Promise<Job> {
  return authApiFetch<Job>('/jobs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function publishJob(id: string): Promise<Job> {
  return authApiFetch<Job>(`/jobs/${id}/publish`, { method: 'POST' });
}

export function completeJob(id: string): Promise<Job> {
  return authApiFetch<Job>(`/jobs/${id}/complete`, { method: 'PATCH' });
}

export function fetchMineJobs(query: QueryJobsInput = {}): Promise<PaginatedResult<Job>> {
  return authApiFetch<PaginatedResult<Job>>(
    `/jobs/mine${toQueryString({ page: query.page, limit: query.limit })}`,
  );
}
