import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Briefcase, ShieldCheck, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';

export async function AuthCard({
  title,
  footer,
  children,
}: {
  title: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  const t = await getTranslations('common');
  const tHome = await getTranslations('home');

  const points = [
    { icon: Briefcase, label: tHome('forWorkersPoint2') },
    { icon: Wallet, label: tHome('statPaymentValue') },
    { icon: ShieldCheck, label: tHome('trustEscrowTitle') },
  ];

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-sm lg:grid-cols-2">
        {/* Panneau de marque — visible à partir de lg, la page reste centrée sur le formulaire en dessous. */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-primary-600 to-primary-500 p-10 text-white lg:flex">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <Briefcase className="h-4 w-4" aria-hidden />
            </span>
            {t('appName')}
          </div>

          <div>
            <p className="text-balance text-2xl font-bold leading-snug">{t('tagline')}</p>
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
          <h1 className="mb-6 text-center text-2xl font-bold text-neutral-900 lg:text-left">{title}</h1>
          {children}
          <div className="mt-6 text-center text-sm text-neutral-600 lg:text-left">{footer}</div>
        </Card>
      </div>
    </div>
  );
}
