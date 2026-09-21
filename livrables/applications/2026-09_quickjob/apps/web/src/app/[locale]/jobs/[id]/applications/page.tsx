'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JobApplicationsList } from '@/components/jobs/job-applications-list';

export default function JobApplicationsPage({ params }: { params: { id: string } }) {
  const t = useTranslations('applications');
  const tAuth = useTranslations('auth');
  const tJobsNew = useTranslations('jobs.new');
  const user = useAuthStore((state) => state.user);

  const canView = Boolean(user?.roles.includes('RECRUITER'));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/jobs/${params.id}`} className="text-sm font-medium text-primary-600 hover:underline">
        ← {t('backToJob')}
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-neutral-900">{t('title')}</h1>

      {canView ? (
        <JobApplicationsList jobId={params.id} />
      ) : (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm text-neutral-600">{tJobsNew('signInPrompt')}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/login">
              <Button variant="outline">{tAuth('loginSubmit')}</Button>
            </Link>
            <Link href="/register">
              <Button>{tAuth('registerSubmit')}</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
