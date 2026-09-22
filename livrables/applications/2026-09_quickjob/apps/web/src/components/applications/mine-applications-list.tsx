'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMineApplications } from '@/features/applications/use-applications';
import { findConversationForJob, useMineConversations } from '@/features/conversations/use-conversations';
import type { ApplicationStatus } from '@/types/api';

const STATUS_TONE: Record<ApplicationStatus, NonNullable<BadgeProps['tone']>> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

function MineApplicationsSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MineApplicationsList() {
  const t = useTranslations('applications');
  const tMine = useTranslations('applications.mine');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const query = useMineApplications();
  const conversationsQuery = useMineConversations();

  if (query.isLoading) {
    return <MineApplicationsSkeleton />;
  }
  if (query.isError) {
    return <p className="mt-8 text-center text-neutral-500">{tErrors('generic')}</p>;
  }

  const applications = query.data ?? [];

  if (applications.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-neutral-500">{tMine('empty')}</p>
        <Link href="/jobs">
          <Button className="mt-4">{tMine('emptyCta')}</Button>
        </Link>
      </div>
    );
  }

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  return (
    <div className="mt-6 space-y-4">
      {applications.map((application) => {
        const conversation =
          application.status === 'ACCEPTED'
            ? findConversationForJob(conversationsQuery.data, application.job?.id)
            : null;

        return (
          <Card key={application.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900">
                  {application.job?.title ?? tMine('missionFallback')}
                </p>
                {application.job?.city ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    {application.job.city}
                    {application.job.countryCode ? `, ${application.job.countryCode}` : ''}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-neutral-400">
                  {tMine('appliedOn', { date: dateFmt.format(new Date(application.createdAt)) })}
                </p>
              </div>
              <Badge tone={STATUS_TONE[application.status]} className="shrink-0">
                {t(`status.${application.status}`)}
              </Badge>
            </div>

            {conversation ? (
              <Link href={`/messages/${conversation.id}`} className="mt-3 inline-block">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {t('chatWithRecruiter')}
                </Button>
              </Link>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
