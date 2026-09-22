'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useAddRole } from '@/features/users/use-users';
import { useApplyToJob, useMineApplications } from '@/features/applications/use-applications';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ApplyButton({ jobId, recruiterId }: { jobId: string; recruiterId: string }) {
  const t = useTranslations('applications');
  const tAuth = useTranslations('auth');
  const user = useAuthStore((state) => state.user);
  const addRole = useAddRole();
  const applyMutation = useApplyToJob(jobId);
  const mineQuery = useMineApplications();

  if (!user) {
    return (
      <Card className="mt-4 p-4 text-center">
        <p className="text-sm text-neutral-600">{t('loginPrompt')}</p>
        <div className="mt-3 flex justify-center gap-3">
          <Link href="/login">
            <Button variant="outline">{tAuth('loginSubmit')}</Button>
          </Link>
          <Link href="/register">
            <Button>{tAuth('registerSubmit')}</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (user.id === recruiterId) {
    return (
      <Card className="mt-4 p-4 text-center">
        <p className="text-sm text-neutral-600">{t('ownJobNotice')}</p>
      </Card>
    );
  }

  if (!user.roles.includes('WORKER')) {
    return (
      <Card className="mt-4 p-4 text-center">
        <p className="text-sm text-neutral-600">{t('activateWorkerBody')}</p>
        <Button
          className="mt-3"
          onClick={() => addRole.mutate('WORKER')}
          isLoading={addRole.isPending}
        >
          {t('activateWorkerButton')}
        </Button>
      </Card>
    );
  }

  const alreadyApplied = mineQuery.data?.some((application) => application.jobId === jobId);

  if (alreadyApplied) {
    return (
      <Card className="mt-4 p-4 text-center">
        <p className="text-sm font-medium text-primary-600">{t('applySuccess')}</p>
      </Card>
    );
  }

  return (
    <Card className="mt-4 p-4 text-center">
      <Button
        className="w-full"
        onClick={() => applyMutation.mutate(undefined)}
        isLoading={applyMutation.isPending || mineQuery.isLoading}
      >
        {t('applyButton')}
      </Button>
      {applyMutation.isError ? <p className="mt-2 text-xs text-danger-600">{t('applyError')}</p> : null}
    </Card>
  );
}
