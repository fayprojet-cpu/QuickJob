'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAcceptInvite, useDeclineInvite, useMineApplications } from '@/features/applications/use-applications';
import { findConversationForJob, useMineConversations } from '@/features/conversations/use-conversations';
import { hasReviewedJob, useMineAuthoredReviews, useReviewRecruiterForApplication } from '@/features/reviews/use-reviews';
import { RatingForm } from '@/components/reviews/rating-form';
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
  const tReviews = useTranslations('reviews');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const query = useMineApplications();
  const conversationsQuery = useMineConversations();
  const authoredReviewsQuery = useMineAuthoredReviews();
  const reviewRecruiterMutation = useReviewRecruiterForApplication();
  const acceptInviteMutation = useAcceptInvite();
  const declineInviteMutation = useDeclineInvite();
  const [openRatingAppId, setOpenRatingAppId] = useState<string | null>(null);

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
        <LinkButton href="/jobs" className="mt-4">
          {tMine('emptyCta')}
        </LinkButton>
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
        const canReview = application.status === 'ACCEPTED' && application.job?.status === 'COMPLETED';
        const alreadyReviewed = canReview && hasReviewedJob(authoredReviewsQuery.data, application.job?.id);
        const isRatingThisApp =
          reviewRecruiterMutation.isPending && reviewRecruiterMutation.variables?.applicationId === application.id;
        const ratingFailedForThisApp =
          reviewRecruiterMutation.isError && reviewRecruiterMutation.variables?.applicationId === application.id;
        const isInvite = application.invitedByRecruiter && application.status === 'PENDING';
        const isAcceptingInvite = acceptInviteMutation.isPending && acceptInviteMutation.variables === application.id;
        const isDecliningInvite = declineInviteMutation.isPending && declineInviteMutation.variables === application.id;
        const inviteFailed =
          (acceptInviteMutation.isError && acceptInviteMutation.variables === application.id) ||
          (declineInviteMutation.isError && declineInviteMutation.variables === application.id);

        return (
          <Card key={application.id} className={isInvite ? 'border-primary-200 bg-primary-50/40 p-4' : 'p-4'}>
            <div className="flex items-start justify-between gap-3">
              <div>
                {isInvite ? <p className="text-xs font-semibold text-primary-600">{tMine('invitedLabel')}</p> : null}
                <p className="font-medium text-neutral-900">
                  {application.job?.title ?? tMine('missionFallback')}
                </p>
                {application.job?.city ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    {application.job.city}
                    {application.job.countryCode ? `, ${application.job.countryCode}` : ''}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-neutral-500">
                  {tMine('appliedOn', { date: dateFmt.format(new Date(application.createdAt)) })}
                </p>
              </div>
              <Badge tone={STATUS_TONE[application.status]} className="shrink-0">
                {t(`status.${application.status}`)}
              </Badge>
            </div>

            {isInvite ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  isLoading={isAcceptingInvite}
                  onClick={() => acceptInviteMutation.mutate(application.id)}
                >
                  {tMine('acceptInvite')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isDecliningInvite}
                  onClick={() => declineInviteMutation.mutate(application.id)}
                >
                  {tMine('declineInvite')}
                </Button>
              </div>
            ) : null}
            {inviteFailed ? <p className="mt-2 text-xs text-danger-600">{tMine('inviteResponseError')}</p> : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {conversation ? (
                <LinkButton href={`/messages/${conversation.id}`} size="sm" variant="outline" className="gap-1.5">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {t('chatWithRecruiter')}
                </LinkButton>
              ) : null}
              {application.status === 'ACCEPTED' && application.job?.latitude && application.job.longitude ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${application.job.latitude},${application.job.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary-500 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                >
                  <Navigation className="h-4 w-4" aria-hidden />
                  {tMine('getDirections')}
                </a>
              ) : null}
              {canReview ? (
                alreadyReviewed ? (
                  <span className="text-xs text-neutral-500">{tReviews('thankYou')}</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenRatingAppId(openRatingAppId === application.id ? null : application.id)}
                  >
                    {tReviews('rateRecruiterButton')}
                  </Button>
                )
              ) : null}
            </div>

            {canReview && !alreadyReviewed && openRatingAppId === application.id ? (
              <RatingForm
                isPending={isRatingThisApp}
                isError={ratingFailedForThisApp}
                onSubmit={(input) =>
                  reviewRecruiterMutation.mutate(
                    { applicationId: application.id, input },
                    { onSuccess: () => setOpenRatingAppId(null) },
                  )
                }
              />
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
