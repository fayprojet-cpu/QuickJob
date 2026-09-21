'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchMineJobs, publishJob } from '@/features/jobs/api';
import { formatMoney } from '@/lib/money';

export function MineJobsList() {
  const t = useTranslations('jobs');
  const tMine = useTranslations('jobs.mine');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({ queryKey: ['jobs', 'mine'], queryFn: () => fetchMineJobs() });

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'mine'] });
    },
  });

  if (jobsQuery.isLoading) {
    return <p className="mt-8 text-center text-neutral-500">{tCommon('loading')}</p>;
  }

  if (jobsQuery.isError) {
    return <p className="mt-8 text-center text-neutral-500">{tErrors('generic')}</p>;
  }

  const jobs = jobsQuery.data?.items ?? [];

  if (jobs.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-neutral-500">{tMine('empty')}</p>
        <Link href="/jobs/new">
          <Button className="mt-4">{tMine('emptyCta')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <Card key={job.id} className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-neutral-900">{job.title}</h3>
            <Badge tone={job.status === 'PUBLISHED' ? 'primary' : 'neutral'} className="shrink-0">
              {t(`status.${job.status}`)}
            </Badge>
          </div>

          <p className="line-clamp-2 text-sm text-neutral-600">{job.description}</p>

          <span className="text-sm font-semibold text-primary-600">
            {formatMoney(job.salaryAmount, job.salaryCurrency, locale)}{' '}
            <span className="font-normal text-neutral-500">{t(`salaryType.${job.salaryType}`)}</span>
          </span>

          <div className="mt-auto flex items-center gap-2 pt-2">
            {job.status === 'PUBLISHED' ? (
              <Link href={`/jobs/${job.id}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  {t('new.viewJob')}
                </Button>
              </Link>
            ) : null}
            {job.status === 'DRAFT' ? (
              <Button
                size="sm"
                className="w-full"
                isLoading={publishMutation.isPending && publishMutation.variables === job.id}
                onClick={() => publishMutation.mutate(job.id)}
              >
                {tMine('draftBadge')}
              </Button>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
