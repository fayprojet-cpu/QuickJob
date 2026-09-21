'use client';

import { useTranslations } from 'next-intl';
import { Megaphone, Search } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useModeSwitch } from '@/features/users/use-mode-switch';
import { cn } from '@/lib/cn';
import type { SelfServiceRole } from '@/types/api';

type ModeTab = {
  mode: SelfServiceRole;
  labelKey: 'lookingForWork' | 'hiring';
  icon: typeof Search;
};

const TABS: ModeTab[] = [
  { mode: 'WORKER', labelKey: 'lookingForWork', icon: Search },
  { mode: 'RECRUITER', labelKey: 'hiring', icon: Megaphone },
];

/**
 * Barre de bascule de mode fixée en bas de l'écran (mobile uniquement), façon
 * appli : deux grands onglets « Je cherche du travail » / « Je recrute ».
 * Le mode courant est mis en évidence ; taper l'autre onglet bascule (et active
 * le rôle manquant si besoin) via le hook partagé useModeSwitch.
 */
export function BottomNav() {
  const t = useTranslations('nav');
  const user = useAuthStore((state) => state.user);
  const { currentMode, switchTo, pendingRole } = useModeSwitch();

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Réserve l'espace pour que la barre fixe ne masque pas le pied de page. */}
      <div className="h-20 sm:hidden" aria-hidden />
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label={t('modeSwitchAria')}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2 p-2">
          {TABS.map(({ mode, labelKey, icon: Icon }) => {
            const active = currentMode === mode;
            const isPending = pendingRole === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => switchTo(mode)}
                disabled={isPending}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-xs font-semibold leading-tight transition-colors disabled:opacity-60',
                  active
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{isPending ? '…' : t(labelKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
