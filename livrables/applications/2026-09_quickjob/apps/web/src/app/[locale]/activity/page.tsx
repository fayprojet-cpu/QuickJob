'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { ActivityView } from '@/components/profile/activity-view';

export default function ActivityPage() {
  const t = useTranslations('activity');
  const tAuth = useTranslations('auth');
  const user = useAuthStore((state) => state.user);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t('subtitle')}</p>

      {user ? (
        <ActivityView />
      ) : (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm text-neutral-600">{t('loginPrompt')}</p>
          <div className="mt-4 flex justify-center gap-3">
            <LinkButton href="/login" variant="outline">
              {tAuth('loginSubmit')}
            </LinkButton>
          </div>
        </Card>
      )}
    </div>
  );
}
