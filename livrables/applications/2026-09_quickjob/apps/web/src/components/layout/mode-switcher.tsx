'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useModeSwitch } from '@/features/users/use-mode-switch';
import { cn } from '@/lib/cn';
import type { SelfServiceRole } from '@/types/api';

const MODES: SelfServiceRole[] = ['WORKER', 'RECRUITER'];

export function ModeSwitcher({
  className,
  onSwitch,
}: {
  className?: string;
  onSwitch?: () => void;
}) {
  const t = useTranslations('nav');
  const user = useAuthStore((state) => state.user);
  const { currentMode, switchTo, pendingRole } = useModeSwitch();

  if (!user) {
    return null;
  }

  const modeLabel: Record<SelfServiceRole, string> = {
    WORKER: t('modeWorker'),
    RECRUITER: t('modeRecruiter'),
  };
  const activateLabel: Record<SelfServiceRole, string> = {
    WORKER: t('activateWorker'),
    RECRUITER: t('activateRecruiter'),
  };

  function handleClick(mode: SelfServiceRole) {
    onSwitch?.();
    switchTo(mode);
  }

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1', className)}>
      {MODES.map((mode) => {
        const owned = user!.roles.includes(mode);
        const active = currentMode === mode;
        const isPending = pendingRole === mode;
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
