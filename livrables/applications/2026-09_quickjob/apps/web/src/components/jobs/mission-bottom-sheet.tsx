'use client';

import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { useAuthStore } from '@/stores/auth-store';
import { useApplyToJob, useMineApplications } from '@/features/applications/use-applications';
import { formatMoney } from '@/lib/money';
import type { Job } from '@/types/api';

export interface RouteSummary {
  distanceKm: number;
  durationMin: number;
}

export function MissionBottomSheet({
  job,
  distanceKm,
  onClose,
  onRequestRoute,
  routeStatus,
  routeSummary,
}: {
  job: Job;
  distanceKm: number | null;
  onClose: () => void;
  onRequestRoute: () => void;
  routeStatus: 'idle' | 'loading' | 'error';
  routeSummary: RouteSummary | null;
}) {
  const t = useTranslations('jobs');
  const tSheet = useTranslations('jobs.map.sheet');
  const locale = useLocale();
  const user = useAuthStore((state) => state.user);
  const applyMutation = useApplyToJob(job.id);
  const mineQuery = useMineApplications();

  const alreadyApplied = mineQuery.data?.some((application) => application.jobId === job.id);
  const isEligible =
    Boolean(user) &&
    Boolean(user?.roles.includes('WORKER')) &&
    user?.id !== job.recruiterId &&
    !alreadyApplied;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="fixed inset-0 z-[1100]" role="dialog" aria-modal="true" aria-label={job.title}>
      <button
        type="button"
        aria-label={tSheet('close')}
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-neutral-900">{job.title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={tSheet('close')}
            className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={job.urgency === 'URGENT' ? 'danger' : 'primary'}>
            {t(`urgency.${job.urgency}`)}
          </Badge>
          {distanceKm !== null ? (
            <span className="text-xs text-neutral-500">
              {t('map.distanceKm', { distance: distanceKm.toFixed(1) })}
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-xl font-bold text-primary-600">
          {job.salaryAmount && job.salaryCurrency
            ? formatMoney(job.salaryAmount, job.salaryCurrency, locale)
            : t('negotiable')}
        </p>

        {job.city ? <p className="mt-1 text-sm text-neutral-500">{job.city}</p> : null}

        <p className="mt-3 line-clamp-3 text-sm text-neutral-600">{job.description}</p>

        {routeSummary ? (
          <p className="mt-3 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700">
            {tSheet('routeSummary', {
              distance: routeSummary.distanceKm.toFixed(1),
              duration: Math.round(routeSummary.durationMin),
            })}
          </p>
        ) : null}
        {routeStatus === 'error' ? (
          <p className="mt-3 text-xs text-neutral-500">{tSheet('routeError')}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <LinkButton href={`/jobs/${job.id}`} variant="outline" size="sm">
            {t('map.viewJob')}
          </LinkButton>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRequestRoute}
            isLoading={routeStatus === 'loading'}
          >
            {tSheet('itinerary')}
          </Button>
          {isEligible ? (
            <Button
              type="button"
              size="sm"
              onClick={() => applyMutation.mutate(undefined)}
              isLoading={applyMutation.isPending}
            >
              {tSheet('apply')}
            </Button>
          ) : null}
        </div>

        {applyMutation.isSuccess ? (
          <p className="mt-2 text-xs font-medium text-primary-600">{tSheet('applySuccess')}</p>
        ) : null}
        {applyMutation.isError ? (
          <p className="mt-2 text-xs text-danger-600">{tSheet('applyError')}</p>
        ) : null}
      </div>
    </div>
  );
}
