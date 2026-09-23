'use client';

import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { useUserReviews } from '@/features/reviews/use-reviews';

type Summary = { average: number | null; count: number };

/**
 * Étoile + moyenne + nombre d'avis d'un utilisateur — silencieux tant que ça
 * charge. En mode `batched`, ne fait jamais sa propre requête : le parent
 * doit fournir `summary` (issu d'un lot groupé pour toute une liste), même
 * `undefined` pendant que ce lot charge — sinon chaque ligne d'une liste
 * déclencherait sa propre requête individuelle en attendant le lot.
 */
export function ReputationBadge({
  userId,
  summary,
  batched = false,
  className,
}: {
  userId: string | null | undefined;
  summary?: Summary;
  batched?: boolean;
  className?: string;
}) {
  const t = useTranslations('reviews');
  const query = useUserReviews(batched ? undefined : userId);

  if (!userId) {
    return null;
  }
  if (batched) {
    if (!summary) {
      return null;
    }
  } else if (query.isLoading || query.isError) {
    return null;
  }

  const { average, count } = (batched ? summary : query.data) ?? { average: null, count: 0 };
  if (count === 0 || average === null) {
    return <span className={`text-xs text-neutral-500 ${className ?? ''}`}>{t('noReviewsYet')}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-neutral-600 ${className ?? ''}`}>
      <Star className="h-3.5 w-3.5 fill-primary-500 text-primary-500" aria-hidden />
      <span className="font-medium text-neutral-900">{average.toFixed(1)}</span>
      <span>{t('reviewCount', { count })}</span>
    </span>
  );
}
