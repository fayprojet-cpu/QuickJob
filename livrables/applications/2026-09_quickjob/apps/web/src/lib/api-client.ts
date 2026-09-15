import { getApiUrl } from './env';
import { toApiError } from './api-error';

interface ApiSuccessBody<T> {
  data: T;
}

/**
 * Client non authentifié — utilisable depuis les Server Components (listing
 * et détail de missions, catégories). Le backend enveloppe toute réponse
 * réussie dans `{ data }` (TransformInterceptor côté API).
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: { cache?: RequestCache; revalidate?: number } = {},
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
    cache: options.cache,
    next: options.revalidate !== undefined ? { revalidate: options.revalidate } : undefined,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  const body = (await response.json()) as ApiSuccessBody<T>;
  return body.data;
}

export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
