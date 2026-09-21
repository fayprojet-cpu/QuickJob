'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useAddRole } from '@/features/users/use-users';
import { getDefaultMode } from '@/lib/mode';
import { cn } from '@/lib/cn';
import type { SelfServiceRole } from '@/types/api';

const MODES: SelfServiceRole[] = ['WORKER', 'RECRUITER'];

export function ModeSwitcher({ className }: { className?: string }) {
  const t = useTranslations('nav');
  const user = useAuthStore((state) => state.user);
  const activeMode = useAuthStore((state) => state.activeMode);
  const setActiveMode = useAuthStore((state) => state.setActiveMode);
  const addRole = useAddRole();

  if (!user) {
    return null;
  }

  const currentMode = activeMode ?? getDefaultMode(user.roles);

  function handleClick(mode: SelfServiceRole) {
    if (user!.roles.includes(mode)) {
      setActiveMode(mode);
    } else {
      addRole.mutate(mode);
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
