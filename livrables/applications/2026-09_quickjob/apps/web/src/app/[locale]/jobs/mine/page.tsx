'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MineJobsList } from '@/components/jobs/mine-jobs-list';

export default function MineJobsPage() {
  const t = useTranslations('jobs.mine');
  const tAuth = useTranslations('auth');
  const user = useAuthStore((state) => state.user);

  const canView = Boolean(user?.roles.includes('RECRUITER'));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>

      {canView ? (
        <MineJobsList />
      ) : (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm text-neutral-600">{t('loginPrompt')}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/login">
              <Button variant="outline">{tAuth('loginSubmit')}</Button>
            </Link>
            <Link href="/jobs/new">
              <Button>{t('emptyCta')}</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
