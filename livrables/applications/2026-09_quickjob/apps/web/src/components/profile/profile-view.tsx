'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { StarRatingDisplay } from '@/components/reviews/star-rating-display';
import { AvatarUploader } from '@/components/profile/avatar-uploader';
import { useAuthStore } from '@/stores/auth-store';
import { useUserProfile } from '@/features/users/use-users';
import { getDefaultMode } from '@/lib/mode';
import { cn } from '@/lib/cn';
import type { UserRole } from '@/types/api';

function ProfileSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function ProfileView({ userId }: { userId: string }) {
  const t = useTranslations('profile');
  const tNav = useTranslations('nav');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const currentUser = useAuthStore((state) => state.user);
  const activeMode = useAuthStore((state) => state.activeMode);
  const query = useUserProfile(userId);

  if (query.isLoading) {
    return <ProfileSkeleton />;
  }
  if (query.isError) {
    return <p className="mt-8 text-center text-neutral-500">{tErrors('generic')}</p>;
  }

  const profile = query.data;
  if (!profile) {
    return null;
  }

  const isOwnProfile = currentUser?.id === userId;
  const name = profile.firstName ?? t('unknownUser');
  const memberSinceYear = new Date(profile.memberSince).getFullYear();
  // Le "mode actif" n'a de sens que sur son propre profil : c'est un état
  // local à l'appareil de la personne connectée, pas une donnée publique
  // qu'on peut connaître pour quelqu'un d'autre.
  const currentMode = isOwnProfile ? (activeMode ?? getDefaultMode(currentUser?.roles ?? [])) : null;
  const roles = profile.roles.filter((role): role is 'WORKER' | 'RECRUITER' => role === 'WORKER' || role === 'RECRUITER');

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar url={profile.avatarUrl} name={name} size="lg" />
          {isOwnProfile ? (
            <div className="absolute -bottom-1 -right-1">
              <AvatarUploader />
            </div>
          ) : null}
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{name}</h1>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {roles.map((role) => {
              const isActive = currentMode === role;
              return (
                <Badge
                  key={role}
                  tone={isActive ? 'primary' : 'neutral'}
                  className={cn(!isActive && currentMode ? 'opacity-60' : '')}
                >
                  {role === 'WORKER' ? tNav('modeWorker') : tNav('modeRecruiter')}
                </Badge>
              );
            })}
          </div>
          <p className="mt-1 text-sm text-neutral-500">{t('memberSince', { year: memberSinceYear })}</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          {profile.reviews.average !== null ? (
            <>
              <StarRatingDisplay rating={Math.round(profile.reviews.average)} size="lg" />
              <div>
                <p className="text-lg font-semibold text-neutral-900">{profile.reviews.average.toFixed(1)} / 5</p>
                <p className="text-sm text-neutral-500">{t('reviewCount', { count: profile.reviews.count })}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500">{t('noReviewsYet')}</p>
          )}
        </div>

        {profile.completedAsWorker > 0 || profile.completedAsRecruiter > 0 ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
            {profile.completedAsWorker > 0 ? (
              <span>{t('completedAsWorker', { count: profile.completedAsWorker })}</span>
            ) : null}
            {profile.completedAsRecruiter > 0 ? (
              <span>{t('completedAsRecruiter', { count: profile.completedAsRecruiter })}</span>
            ) : null}
          </div>
        ) : null}
      </Card>

      {isOwnProfile ? (
        <Link href="/activity">
          <Button variant="outline" size="sm" className="w-full">
            {t('viewMyActivity')}
          </Button>
        </Link>
      ) : null}

      {profile.reviews.items.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{t('receivedReviews')}</h2>
          <div className="mt-3 space-y-3">
            {profile.reviews.items.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <StarRatingDisplay rating={review.rating} />
                  <span className="text-xs text-neutral-400">
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(review.createdAt))}
                  </span>
                </div>
                {review.comment ? <p className="mt-2 text-sm text-neutral-700">{review.comment}</p> : null}
                <p className="mt-2 text-xs text-neutral-500">
                  {t('reviewBy', { name: review.authorFirstName ?? t('unknownUser') })}
                </p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
