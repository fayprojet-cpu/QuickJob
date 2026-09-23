'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { MineApplicationsList } from '@/components/applications/mine-applications-list';

export default function MineApplicationsPage() {
  const t = useTranslations('applications.mine');
  const tAuth = useTranslations('auth');
  const user = useAuthStore((state) => state.user);

  const canView = Boolean(user?.roles.includes('WORKER'));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>

      {canView ? (
        <MineApplicationsList />
      ) : (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm text-neutral-600">{t('loginPrompt')}</p>
          <div className="mt-4 flex justify-center gap-3">
            <LinkButton href="/login" variant="outline">
              {tAuth('loginSubmit')}
            </LinkButton>
            <LinkButton href="/jobs">{t('emptyCta')}</LinkButton>
          </div>
        </Card>
      )}
    </div>
  );
}
