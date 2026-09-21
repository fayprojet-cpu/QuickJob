'use client';

import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getDefaultMode } from '@/lib/mode';
import { useAddRole } from './use-users';
import type { SelfServiceRole } from '@/types/api';

/**
 * Page d'accueil de chaque mode. On y navigue à la bascule pour que le contenu
 * affiché corresponde toujours au mode choisi.
 */
const MODE_HOME: Record<SelfServiceRole, string> = {
  WORKER: '/jobs',
  RECRUITER: '/jobs/mine',
};

/**
 * Logique de bascule de mode, partagée entre le sélecteur du header (desktop)
 * et la barre du bas (mobile) — une seule source de vérité. Si l'utilisateur
 * ne possède pas encore le rôle visé, on le lui ajoute (useAddRole) avant de
 * naviguer ; sinon on change simplement de mode actif.
 */
export function useModeSwitch() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const activeMode = useAuthStore((state) => state.activeMode);
  const setActiveMode = useAuthStore((state) => state.setActiveMode);
  const addRole = useAddRole();

  const currentMode = activeMode ?? (user ? getDefaultMode(user.roles) : null);

  function switchTo(mode: SelfServiceRole): void {
    if (!user) {
      return;
    }
    if (user.roles.includes(mode)) {
      setActiveMode(mode);
      router.push(MODE_HOME[mode]);
    } else {
      addRole.mutate(mode, { onSuccess: () => router.push(MODE_HOME[mode]) });
    }
  }

  return {
    currentMode,
    switchTo,
    isPending: addRole.isPending,
    pendingRole: addRole.isPending ? addRole.variables ?? null : null,
  };
}
