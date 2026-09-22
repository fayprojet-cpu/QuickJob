import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Bloc de chargement générique — anime un rectangle gris à la forme du contenu attendu. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-lg bg-neutral-200', className)} {...props} />;
}
