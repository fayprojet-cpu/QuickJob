import { cn } from '@/lib/cn';

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-2xl',
} as const;

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/** Photo de profil si connue, sinon un cercle avec l'initiale du nom. */
export function Avatar({
  url,
  name,
  size = 'md',
  className,
}: {
  url: string | null | undefined;
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover', SIZE_CLASSES[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700',
        SIZE_CLASSES[size],
        className,
      )}
      aria-hidden
    >
      {initialOf(name)}
    </span>
  );
}
