'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { completeJob, fetchMineJobs, publishJob } from '@/features/jobs/api';
import { findConversationForJob, useMineConversations } from '@/features/conversations/use-conversations';
import { hasReviewedJob, useMineAuthoredReviews, useReviewWorkerForJob } from '@/features/reviews/use-reviews';
import { RatingForm } from '@/components/reviews/rating-form';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { ConversationSummary, CreateReviewInput, Job, JobStatus } from '@/types/api';

const STATUS_TONE: Record<JobStatus, NonNullable<BadgeProps['tone']>> = {
  DRAFT: 'neutral',
  PUBLISHED: 'primary',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  EXPIRED: 'neutral',
  CANCELLED: 'danger',
};

const HISTORY_STATUSES: JobStatus[] = ['COMPLETED', 'CANCELLED', 'EXPIRED'];

function MineJobsSkeleton() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-auto h-9 w-full" />
        </Card>
      ))}
    </div>
  );
}

interface JobCardProps {
  job: Job;
  locale: string;
  conversation: ConversationSummary | null;
  alreadyReviewed: boolean;
  isRatingOpen: boolean;
  onToggleRating: () => void;
  onSubmitRating: (input: CreateReviewInput) => void;
  isRatingPending: boolean;
  isRatingError: boolean;
  publishMutation: UseMutationResult<Job, Error, string>;
  completeMutation: UseMutationResult<Job, Error, string>;
}

function JobCard({
  job,
  locale,
  conversation,
  alreadyReviewed,
  isRatingOpen,
  onToggleRating,
  onSubmitRating,
  isRatingPending,
  isRatingError,
  publishMutation,
  completeMutation,
}: JobCardProps) {
  const t = useTranslations('jobs');
  const tMine = useTranslations('jobs.mine');
  const tApplications = useTranslations('applications');
  const tReviews = useTranslations('reviews');
  const { salaryAmount, salaryCurrency } = job;

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-neutral-900">{job.title}</h3>
        <Badge tone={STATUS_TONE[job.status]} className="shrink-0">
          {t(`status.${job.status}`)}
        </Badge>
      </div>

      <p className="line-clamp-2 text-sm text-neutral-600">{job.description}</p>

      <span className="text-sm font-semibold text-primary-600">
        {salaryAmount && salaryCurrency ? (
          <>
            {formatMoney(salaryAmount, salaryCurrency, locale)}{' '}
            <span className="font-normal text-neutral-500">{t(`salaryType.${job.salaryType}`)}</span>
          </>
        ) : (
          t('negotiable')
        )}
      </span>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {job.status === 'PUBLISHED' ? (
          <>
            <Link href={`/jobs/${job.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                {t('new.viewJob')}
              </Button>
            </Link>
            <Link href={`/jobs/${job.id}/applications`} className="flex-1">
              <Button size="sm" className="w-full">
                {tApplications('viewApplications')}
              </Button>
            </Link>
          </>
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
        {job.status === 'IN_PROGRESS' ? (
          <div className="flex w-full flex-col gap-2">
            <div className="flex gap-2">
              <Link href={`/jobs/${job.id}/applications`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  {tApplications('viewApplications')}
                </Button>
              </Link>
              {conversation ? (
                <Link href={`/messages/${conversation.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                    {tMine('chat')}
                  </Button>
                </Link>
              ) : null}
            </div>
            <Button
              size="sm"
              className="w-full"
              isLoading={completeMutation.isPending && completeMutation.variables === job.id}
              onClick={() => completeMutation.mutate(job.id)}
            >
              {tMine('markCompleted')}
            </Button>
          </div>
        ) : null}
        {job.status === 'COMPLETED' ? (
          <div className="flex w-full flex-col gap-2">
            <div className="flex gap-2">
              <Link href={`/jobs/${job.id}/applications`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  {tApplications('viewApplications')}
                </Button>
              </Link>
              {alreadyReviewed ? (
                <span className="flex flex-1 items-center justify-center text-xs text-neutral-500">
                  {tReviews('thankYou')}
                </span>
              ) : (
                <Button variant="outline" size="sm" className="flex-1" onClick={onToggleRating}>
                  {tReviews('rateWorkerButton')}
                </Button>
              )}
            </div>
            {isRatingOpen && !alreadyReviewed ? (
              <RatingForm isPending={isRatingPending} isError={isRatingError} onSubmit={onSubmitRating} />
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function MineJobsList() {
  const tMine = useTranslations('jobs.mine');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({ queryKey: ['jobs', 'mine'], queryFn: () => fetchMineJobs() });
  const conversationsQuery = useMineConversations();
  const authoredReviewsQuery = useMineAuthoredReviews();
  const reviewWorkerMutation = useReviewWorkerForJob();
  const [openRatingJobId, setOpenRatingJobId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'mine'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'mine'] });
    },
  });

  if (jobsQuery.isLoading) {
    return <MineJobsSkeleton />;
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

  const activeJobs = jobs.filter((job) => !HISTORY_STATUSES.includes(job.status));
  const historyJobs = jobs.filter((job) => HISTORY_STATUSES.includes(job.status));

  function renderCard(job: Job) {
    const conversation = findConversationForJob(conversationsQuery.data, job.id);
    const alreadyReviewed = hasReviewedJob(authoredReviewsQuery.data, job.id);
    const isRatingThisJob = reviewWorkerMutation.isPending && reviewWorkerMutation.variables?.jobId === job.id;
    const ratingFailedForThisJob = reviewWorkerMutation.isError && reviewWorkerMutation.variables?.jobId === job.id;

    return (
      <JobCard
        key={job.id}
        job={job}
        locale={locale}
        conversation={conversation}
        alreadyReviewed={alreadyReviewed}
        isRatingOpen={openRatingJobId === job.id}
        onToggleRating={() => setOpenRatingJobId(openRatingJobId === job.id ? null : job.id)}
        onSubmitRating={(input) =>
          reviewWorkerMutation.mutate({ jobId: job.id, input }, { onSuccess: () => setOpenRatingJobId(null) })
        }
        isRatingPending={isRatingThisJob}
        isRatingError={ratingFailedForThisJob}
        publishMutation={publishMutation}
        completeMutation={completeMutation}
      />
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {activeJobs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activeJobs.map(renderCard)}</div>
      ) : (
        <p className="text-center text-neutral-500">{tMine('noActiveJobs')}</p>
      )}

      {historyJobs.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory((open) => !open)}
            className="flex w-full items-center gap-2 border-t border-neutral-200 pt-4 text-sm font-medium text-neutral-700"
            aria-expanded={showHistory}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', showHistory ? 'rotate-180' : '')} aria-hidden />
            {tMine('historyToggle', { count: historyJobs.length })}
          </button>
          {showHistory ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{historyJobs.map(renderCard)}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
