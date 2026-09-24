import { apiFetch, toQueryString } from '@/lib/api-client';
import { authApiFetch } from '@/lib/auth-api-client';
import type {
  Category,
  CreateJobInput,
  Job,
  MapBounds,
  PaginatedResult,
  QueryJobsInput,
} from '@/types/api';

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

/** Missions publiées dans une zone géographique — pour la carte, toujours à jour (pas de cache ISR). */
export function fetchJobsInBounds(bounds: MapBounds): Promise<Job[]> {
  return apiFetch<PaginatedResult<Job>>(
    `/jobs${toQueryString({
      limit: 100,
      minLat: bounds.minLat,
      maxLat: bounds.maxLat,
      minLng: bounds.minLng,
      maxLng: bounds.maxLng,
    })}`,
  ).then((result) => result.items);
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
