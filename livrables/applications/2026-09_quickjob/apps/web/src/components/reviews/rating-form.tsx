'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import type { CreateReviewInput } from '@/types/api';

/** 5 étoiles cliquables + commentaire optionnel + envoi — 1 tap pour noter. */
export function RatingForm({
  onSubmit,
  isPending,
  isError,
}: {
  onSubmit: (input: CreateReviewInput) => void;
  isPending: boolean;
  isError: boolean;
}) {
  const t = useTranslations('reviews');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');

  function handleSubmit() {
    if (rating < 1 || isPending) {
      return;
    }
    onSubmit({ rating, comment: comment.trim() || undefined });
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex gap-1" role="radiogroup" aria-label={t('rateLabel')}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = (hovered || rating) >= star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={t('starAria', { count: star })}
              aria-pressed={rating === star}
            >
              <Star
                className={cn('h-7 w-7 transition-colors', filled ? 'fill-primary-500 text-primary-500' : 'text-neutral-300')}
              />
            </button>
          );
        })}
      </div>

      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={t('commentPlaceholder')}
        maxLength={500}
        rows={2}
        aria-label={t('commentPlaceholder')}
      />

      {isError ? <p className="text-xs text-danger-600">{t('submitError')}</p> : null}

      <Button size="sm" onClick={handleSubmit} isLoading={isPending} disabled={rating < 1}>
        {t('submit')}
      </Button>
    </div>
  );
}
