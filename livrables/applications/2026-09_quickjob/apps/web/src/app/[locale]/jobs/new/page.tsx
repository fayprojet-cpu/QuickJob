'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useAddRole } from '@/features/users/use-users';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JobForm } from '@/components/jobs/job-form';

export default function NewJobPage() {
  const t = useTranslations('jobs.new');
  const tAuth = useTranslations('auth');
  const user = useAuthStore((state) => state.user);
  const addRole = useAddRole();

  const canPostJob = Boolean(user?.roles.includes('RECRUITER'));

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('title')}</h1>
      <p className="mt-1 text-sm text-neutral-600">{t('subtitle')}</p>

      <Card className="mt-6 p-6">
        {canPostJob ? (
          <JobForm />
        ) : user ? (
          <div className="text-center">
            <h2 className="font-semibold text-neutral-900">{t('forbiddenTitle')}</h2>
            <p className="mt-2 text-sm text-neutral-600">{t('activateRecruiterBody')}</p>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => addRole.mutate('RECRUITER')} isLoading={addRole.isPending}>
                {t('activateRecruiterButton')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="font-semibold text-neutral-900">{t('forbiddenTitle')}</h2>
            <p className="mt-2 text-sm text-neutral-600">{t('forbiddenBody')}</p>
            <p className="mt-1 text-sm text-neutral-600">{t('signInPrompt')}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/login">
                <Button variant="outline">{tAuth('loginSubmit')}</Button>
              </Link>
              <Link href="/register">
                <Button>{tAuth('registerSubmit')}</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
