'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import type { SelfServiceRole, UpdateUserInput, UpdateWorkerSettingsInput } from '@/types/api';
import {
  addRole,
  fetchMyActivity,
  fetchMyWorkerSettings,
  fetchSkillsCatalog,
  fetchUserProfile,
  updateMe,
  updateMyWorkerSettings,
  uploadAvatar,
} from './api';

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

/** Change la photo de profil du compte connecté et rafraîchit sa page profil publique. */
export function useUploadAvatar() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['users', user.id, 'profile'] });
    },
  });
}

/** Profil public d'un utilisateur — nom, réputation, avis reçus. */
export function useUserProfile(userId: string) {
  return useQuery({ queryKey: ['users', userId, 'profile'], queryFn: () => fetchUserProfile(userId) });
}

/** Historique privé complet du compte connecté (missions, prix, dates). */
export function useMyActivity() {
  return useQuery({ queryKey: ['users', 'me', 'activity'], queryFn: fetchMyActivity });
}

/** Catalogue public des compétences (métiers) disponibles. */
export function useSkillsCatalog() {
  return useQuery({ queryKey: ['skills'], queryFn: fetchSkillsCatalog });
}

/** Profil polyvalent (compétences, missions simples, disponibilité, zone) du compte connecté. */
export function useMyWorkerSettings() {
  return useQuery({ queryKey: ['users', 'me', 'worker-settings'], queryFn: fetchMyWorkerSettings });
}

export function useUpdateWorkerSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWorkerSettingsInput) => updateMyWorkerSettings(input),
    onSuccess: (settings) => {
      queryClient.setQueryData(['users', 'me', 'worker-settings'], settings);
    },
  });
}
