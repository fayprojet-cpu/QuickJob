'use client';

import { useAuthStore } from '@/stores/auth-store';
import type { AuthTokens } from '@/types/api';
import { getApiUrl } from './env';
import { toApiError, ApiError } from './api-error';

interface ApiSuccessBody<T> {
  data: T;
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
}

async function refreshSession(): Promise<string | null> {
  const { refreshToken, setTokens, clearSession } = useAuthStore.getState();
  if (!refreshToken) {
    return null;
  }

  const response = await rawFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearSession();
    return null;
  }

  const body = (await response.json()) as ApiSuccessBody<AuthTokens>;
  setTokens(body.data);
  return body.data.accessToken;
}

/**
 * Client authentifié — usage strictement côté client (lit le token depuis le
 * store Zustand persisté). Rejoue une fois la requête après un refresh en
 * cas de 401 (access token expiré).
 */
export async function authApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let accessToken = useAuthStore.getState().accessToken;

  let response = await rawFetch(path, {
    ...init,
    headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers },
  });

  if (response.status === 401) {
    accessToken = await refreshSession();
    if (!accessToken) {
      throw new ApiError(401, 'Session expired');
    }
    response = await rawFetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
    });
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  const body = (await response.json()) as ApiSuccessBody<T>;
  return body.data;
}
