'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useAcceptApplication,
  useJobApplications,
  useRejectApplication,
} from '@/features/applications/use-applications';
import type { ApplicationStatus } from '@/types/api';

const STATUS_TONE: Record<ApplicationStatus, 'neutral' | 'primary' | 'urgent'> = {
  PENDING: 'neutral',
  ACCEPTED: 'primary',
  REJECTED: 'urgent',
  WITHDRAWN: 'neutral',
};

export function JobApplicationsList({ jobId }: { jobId: string }) {
  const t = useTranslations('applications');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const applicationsQuery = useJobApplications(jobId);
  const acceptMutation = useAcceptApplication(jobId);
  const rejectMutation = useRejectApplication(jobId);

  if (applicationsQuery.isLoading) {
    return <p className="mt-8 text-center text-neutral-500">{tCommon('loading')}</p>;
  }
  if (applicationsQuery.isError) {
    return <p className="mt-8 text-center text-neutral-500">{tErrors('generic')}</p>;
  }

  const applications = applicationsQuery.data ?? [];

  if (applications.length === 0) {
    return <p className="mt-8 text-center text-neutral-500">{t('empty')}</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      {applications.map((application) => {
        const pending = application.status === 'PENDING';
        const isAccepting = acceptMutation.isPending && acceptMutation.variables === application.id;
        const isRejecting = rejectMutation.isPending && rejectMutation.variables === application.id;
        const decideFailed =
          (acceptMutation.isError && acceptMutation.variables === application.id) ||
          (rejectMutation.isError && rejectMutation.variables === application.id);

        return (
          <Card key={application.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900">
                  {application.worker?.email ?? application.worker?.phone ?? application.workerId}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {application.coverLetter || t('coverLetterNone')}
                </p>
              </div>
              <Badge tone={STATUS_TONE[application.status]} className="shrink-0">
                {t(`status.${application.status}`)}
              </Badge>
            </div>

            {pending ? (
              <div className="mt-3 flex gap-2">
                <Button size="sm" isLoading={isAccepting} onClick={() => acceptMutation.mutate(application.id)}>
                  {t('accept')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isRejecting}
                  onClick={() => rejectMutation.mutate(application.id)}
                >
                  {t('reject')}
                </Button>
              </div>
            ) : null}

            {decideFailed ? <p className="mt-2 text-xs text-red-600">{t('decideError')}</p> : null}
          </Card>
        );
      })}
    </div>
  );
}
