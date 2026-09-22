import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

/** 5 étoiles en lecture seule — pour afficher une note déjà donnée. */
export function StarRatingDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const starSize = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(starSize, star <= rating ? 'fill-primary-500 text-primary-500' : 'text-neutral-300')}
          aria-hidden
        />
      ))}
    </div>
  );
}
