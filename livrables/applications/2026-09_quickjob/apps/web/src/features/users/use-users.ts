'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import type { SelfServiceRole, UpdateUserInput } from '@/types/api';
import { addRole, updateMe } from './api';

/** Ajoute un rôle au compte connecté puis bascule dessus (mode actif). */
export function useAddRole() {
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveMode = useAuthStore((state) => state.setActiveMode);

  return useMutation({
    mutationFn: (role: SelfServiceRole) => addRole(role),
    onSuccess: (user, role) => {
      setUser(user);
      setActiveMode(role);
    },
  });
}

/** Met à jour le profil du compte connecté (ex. prénom manquant). */
export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateMe(input),
    onSuccess: (user) => {
      setUser(user);
    },
  });
}
