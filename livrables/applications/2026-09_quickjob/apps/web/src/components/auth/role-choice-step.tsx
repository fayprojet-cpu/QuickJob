'use client';

import { useTranslations } from 'next-intl';
import { Megaphone, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

type Role = 'WORKER' | 'RECRUITER';

const CARDS: Array<{ role: Role; icon: typeof Search; titleKey: 'roleWorker' | 'roleRecruiter'; subtitleKey: 'roleWorkerSubtitle' | 'roleRecruiterSubtitle' }> = [
  { role: 'WORKER', icon: Search, titleKey: 'roleWorker', subtitleKey: 'roleWorkerSubtitle' },
  { role: 'RECRUITER', icon: Megaphone, titleKey: 'roleRecruiter', subtitleKey: 'roleRecruiterSubtitle' },
];

/** Premier écran d'inscription : on choisit son point de départ, pas un compte à part — les deux rôles restent activables plus tard. */
export function RoleChoiceStep({ onSelect }: { onSelect: (role: Role) => void }) {
  const t = useTranslations('auth');

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CARDS.map(({ role, icon: Icon, titleKey, subtitleKey }) => (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            className={cn(
              'group flex flex-col items-start gap-3 rounded-xl border border-neutral-200 p-5 text-left transition-all',
              'hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            )}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-500 group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-neutral-900">{t(titleKey)} →</span>
              <span className="mt-1 block text-sm text-neutral-500">{t(subtitleKey)}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-neutral-500 sm:text-left">{t('registerRoleNote')}</p>
    </div>
  );
}
