'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { InviteWorkerPicker } from '@/components/profile/invite-worker-picker';
import { useMyActivity } from '@/features/users/use-users';
import { formatMoney } from '@/lib/money';
import type { ActivityItem } from '@/types/api';

function ActivitySkeleton() {
  return (
    <div className="mt-6 space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  );
}

function ActivityRow({ item, withInvite }: { item: ActivityItem; withInvite: boolean }) {
  const t = useTranslations('activity');
  const locale = useLocale();
  const [invitingWorkerId, setInvitingWorkerId] = useState<string | null>(null);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const isInviting = withInvite && item.counterpart && invitingWorkerId === item.counterpart.id;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-neutral-900">{item.jobTitle}</p>
          <p className="mt-1 text-sm text-neutral-600">
            {item.amount && item.currency ? formatMoney(item.amount, item.currency, locale) : t('negotiable')}
          </p>
          <p className="mt-1 text-xs text-neutral-500">{dateFmt.format(new Date(item.completedAt))}</p>
          {item.counterpart ? (
            <Link href={`/profile/${item.counterpart.id}`} className="mt-1 inline-block text-xs text-primary-600 hover:underline">
              {t('withPerson', { name: item.counterpart.firstName ?? t('unknownUser') })}
            </Link>
          ) : null}
        </div>
        {withInvite && item.counterpart ? (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => setInvitingWorkerId(isInviting ? null : (item.counterpart?.id ?? null))}
          >
            {t('reinvite')}
          </Button>
        ) : null}
      </div>
      {isInviting && item.counterpart ? (
        <InviteWorkerPicker workerId={item.counterpart.id} onDone={() => setInvitingWorkerId(null)} />
      ) : null}
    </Card>
  );
}

export function ActivityView() {
  const t = useTranslations('activity');
  const tErrors = useTranslations('errors');
  const query = useMyActivity();

  if (query.isLoading) {
    return <ActivitySkeleton />;
  }
  if (query.isError) {
    return <p className="mt-8 text-center text-neutral-500">{tErrors('generic')}</p>;
  }

  const activity = query.data;
  if (!activity) {
    return null;
  }

  const hasAny = activity.asWorker.length > 0 || activity.asRecruiter.length > 0;
  if (!hasAny) {
    return <p className="mt-8 text-center text-neutral-500">{t('empty')}</p>;
  }

  return (
    <div className="mt-6 space-y-8">
      {activity.asWorker.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{t('asWorkerTitle')}</h2>
          <div className="mt-3 space-y-3">
            {activity.asWorker.map((item) => (
              <ActivityRow key={item.jobId} item={item} withInvite={false} />
            ))}
          </div>
        </div>
      ) : null}

      {activity.asRecruiter.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{t('asRecruiterTitle')}</h2>
          <div className="mt-3 space-y-3">
            {activity.asRecruiter.map((item) => (
              <ActivityRow key={item.jobId} item={item} withInvite />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
