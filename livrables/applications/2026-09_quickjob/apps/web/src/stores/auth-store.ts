import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, AuthUser, SelfServiceRole } from '@/types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  /** Mode actif ("je cherche du travail" / "je recrute") — null = pas encore choisi. */
  activeMode: SelfServiceRole | null;
  setSession: (tokens: AuthTokens, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (tokens: AuthTokens) => void;
  setActiveMode: (mode: SelfServiceRole) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      activeMode: null,
      setSession: (tokens, user) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
        }),
      setUser: (user) => set({ user }),
      setTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setActiveMode: (mode) => set({ activeMode: mode }),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, user: null, activeMode: null }),
    }),
    { name: 'quickjob-auth' },
  ),
);
