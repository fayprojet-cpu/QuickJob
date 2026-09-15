'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginInput, RegisterInput } from '@/types/api';
import { fetchMeWithToken, loginUser, logoutUser, registerUser } from './api';

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const tokens = await registerUser(input);
      const user = await fetchMeWithToken(tokens.accessToken);
      return { tokens, user };
    },
    onSuccess: ({ tokens, user }) => setSession(tokens, user),
  });
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const tokens = await loginUser(input);
      const user = await fetchMeWithToken(tokens.accessToken);
      return { tokens, user };
    },
    onSuccess: ({ tokens, user }) => setSession(tokens, user),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    },
    onSettled: () => clearSession(),
  });
}
