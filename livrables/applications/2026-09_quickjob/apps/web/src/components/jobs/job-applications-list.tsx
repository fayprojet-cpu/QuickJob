'use client';

import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAcceptApplication,
  useJobApplications,
  useRejectApplication,
} from '@/features/applications/use-applications';
import { findConversationForJob, useMineConversations } from '@/features/conversations/use-conversations';
import type { ApplicationStatus } from '@/types/api';

const STATUS_TONE: Record<ApplicationStatus, NonNullable<BadgeProps['tone']>> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

function ApplicationsSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function JobApplicationsList({ jobId }: { jobId: string }) {
  const t = useTranslations('applications');
  const tErrors = useTranslations('errors');
  const applicationsQuery = useJobApplications(jobId);
  const acceptMutation = useAcceptApplication(jobId);
  const rejectMutation = useRejectApplication(jobId);
  const conversationsQuery = useMineConversations();
  const conversation = findConversationForJob(conversationsQuery.data, jobId);

  if (applicationsQuery.isLoading) {
    return <ApplicationsSkeleton />;
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

            {application.status === 'ACCEPTED' && conversation ? (
              <Link href={`/messages/${conversation.id}`} className="mt-3 inline-block">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {t('chatWithWorker')}
                </Button>
              </Link>
            ) : null}

            {decideFailed ? <p className="mt-2 text-xs text-danger-600">{t('decideError')}</p> : null}
          </Card>
        );
      })}
    </div>
  );
}
