'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Briefcase, ShieldCheck, Wallet } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { RoleChoiceStep } from './role-choice-step';
import { RegisterForm } from './register-form';

type Role = 'WORKER' | 'RECRUITER';

/**
 * Inscription en 2 étapes (choix du point de départ, puis formulaire) — le
 * même habillage "panneau de marque + carte" que AuthCard, mais en
 * composant client (le titre change selon l'étape, et AuthCard s'appuie sur
 * des traductions serveur qu'on ne peut pas appeler depuis ici).
 */
export function RegisterFlow() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tHome = useTranslations('home');
  const [role, setRole] = useState<Role | null>(null);

  const points = [
    { icon: Briefcase, label: tHome('forWorkersPoint2') },
    { icon: Wallet, label: tHome('statPaymentValue') },
    { icon: ShieldCheck, label: tHome('trustEscrowTitle') },
  ];

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-sm lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-primary-600 to-primary-500 p-10 text-white lg:flex">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <Briefcase className="h-4 w-4" aria-hidden />
            </span>
            {tCommon('appName')}
          </div>

          <div>
            <p className="text-balance text-2xl font-bold leading-snug">{tCommon('tagline')}</p>
            <ul className="mt-8 space-y-4">
              {points.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-primary-50">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden />
        </div>

        <Card className="rounded-none border-0 p-6 shadow-none sm:p-8 lg:rounded-r-2xl">
          <h1 className="mb-6 text-center text-2xl font-bold text-neutral-900 lg:text-left">
            {role ? t('registerTitle') : t('chooseRoleTitle')}
          </h1>

          {role ? (
            <RegisterForm role={role} onBack={() => setRole(null)} />
          ) : (
            <RoleChoiceStep onSelect={setRole} />
          )}

          <div className="mt-6 text-center text-sm text-neutral-600 lg:text-left">
            {t('registerHaveAccount')}{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:underline">
              {t('loginSubmit')}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
