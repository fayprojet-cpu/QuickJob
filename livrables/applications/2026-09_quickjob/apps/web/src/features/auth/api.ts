import { apiFetch } from '@/lib/api-client';
import { authApiFetch } from '@/lib/auth-api-client';
import { getApiUrl } from '@/lib/env';
import { toApiError } from '@/lib/api-error';
import type { AuthTokens, AuthUser, LoginInput, RegisterInput } from '@/types/api';

export function registerUser(input: RegisterInput): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginUser(input: LoginInput): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchMeWithToken(accessToken: string): Promise<AuthUser> {
  const response = await fetch(`${getApiUrl()}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw await toApiError(response);
  }
  const body = (await response.json()) as { data: AuthUser };
  return body.data;
}

export function logoutUser(refreshToken: string): Promise<void> {
  return authApiFetch<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(input: { token: string; newPassword: string }): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
