'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMineApplications } from '@/features/applications/use-applications';
import type { ApplicationStatus } from '@/types/api';

const STATUS_TONE: Record<ApplicationStatus, 'neutral' | 'primary' | 'urgent'> = {
  PENDING: 'neutral',
  ACCEPTED: 'primary',
  REJECTED: 'urgent',
  WITHDRAWN: 'neutral',
};

export function MineApplicationsList() {
  const t = useTranslations('applications');
  const tMine = useTranslations('applications.mine');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const query = useMineApplications();

  if (query.isLoading) {
    return <p className="mt-8 text-center text-neutral-500">{tCommon('loading')}</p>;
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
      {applications.map((application) => (
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
        </Card>
      ))}
    </div>
  );
}
