'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useAddRole } from '@/features/users/use-users';
import { getDefaultMode } from '@/lib/mode';
import { cn } from '@/lib/cn';
import type { SelfServiceRole } from '@/types/api';

const MODES: SelfServiceRole[] = ['WORKER', 'RECRUITER'];

/**
 * Page d'accueil de chaque mode. On y navigue à la bascule pour que le contenu
 * affiché corresponde toujours au mode choisi (sinon on reste, par ex., sur
 * « Publier une mission » même après être passé en mode Travailleur).
 */
const MODE_HOME: Record<SelfServiceRole, string> = {
  WORKER: '/jobs',
  RECRUITER: '/jobs/mine',
};

export function ModeSwitcher({
  className,
  onSwitch,
}: {
  className?: string;
  onSwitch?: () => void;
}) {
  const t = useTranslations('nav');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const activeMode = useAuthStore((state) => state.activeMode);
  const setActiveMode = useAuthStore((state) => state.setActiveMode);
  const addRole = useAddRole();

  if (!user) {
    return null;
  }

  const currentMode = activeMode ?? getDefaultMode(user.roles);

  function goToMode(mode: SelfServiceRole) {
    onSwitch?.();
    router.push(MODE_HOME[mode]);
  }

  function handleClick(mode: SelfServiceRole) {
    if (user!.roles.includes(mode)) {
      setActiveMode(mode);
      goToMode(mode);
    } else {
      // useAddRole met déjà à jour les rôles + le mode actif ; on navigue ensuite.
      addRole.mutate(mode, { onSuccess: () => goToMode(mode) });
    }
  }

  const modeLabel: Record<SelfServiceRole, string> = {
    WORKER: t('modeWorker'),
    RECRUITER: t('modeRecruiter'),
  };
  const activateLabel: Record<SelfServiceRole, string> = {
    WORKER: t('activateWorker'),
    RECRUITER: t('activateRecruiter'),
  };

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1', className)}>
      {MODES.map((mode) => {
        const owned = user.roles.includes(mode);
        const active = currentMode === mode;
        const isPending = addRole.isPending && addRole.variables === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => handleClick(mode)}
            disabled={isPending}
            title={owned ? modeLabel[mode] : activateLabel[mode]}
            aria-pressed={active}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
              active
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900',
            )}
          >
            {isPending ? '…' : owned ? modeLabel[mode] : `+ ${activateLabel[mode]}`}
          </button>
        );
      })}
    </div>
  );
}
