'use client';

import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { useUserReviews } from '@/features/reviews/use-reviews';

/** Étoile + moyenne + nombre d'avis d'un utilisateur — silencieux tant que ça charge. */
export function ReputationBadge({ userId, className }: { userId: string | null | undefined; className?: string }) {
  const t = useTranslations('reviews');
  const query = useUserReviews(userId);

  if (!userId || query.isLoading || query.isError) {
    return null;
  }

  const { average, count } = query.data ?? { average: null, count: 0 };
  if (count === 0 || average === null) {
    return <span className={`text-xs text-neutral-400 ${className ?? ''}`}>{t('noReviewsYet')}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-neutral-600 ${className ?? ''}`}>
      <Star className="h-3.5 w-3.5 fill-primary-500 text-primary-500" aria-hidden />
      <span className="font-medium text-neutral-900">{average.toFixed(1)}</span>
      <span>{t('reviewCount', { count })}</span>
    </span>
  );
}
