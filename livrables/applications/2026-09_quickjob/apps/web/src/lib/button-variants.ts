import { cn } from '@/lib/cn';

export const BUTTON_VARIANT_CLASSES = {
  primary: 'bg-primary-500 text-white shadow-sm hover:bg-primary-600 hover:shadow active:bg-primary-700',
  outline: 'border border-primary-500 text-primary-600 hover:bg-primary-50',
  ghost: 'text-neutral-700 hover:bg-neutral-100',
} as const;

export const BUTTON_SIZE_CLASSES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASSES;
export type ButtonSize = keyof typeof BUTTON_SIZE_CLASSES;

/**
 * Classes visuelles partagées entre <Button> (élément <button>) et
 * <LinkButton> (élément <a> stylé pareil) — un seul et même bouton visuel ne
 * doit jamais imbriquer un <button> dans un <a> (invalide en HTML, et deux
 * arrêts de tabulation au clavier pour un seul contrôle).
 */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
  disabled?: boolean,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
    'transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    disabled && 'pointer-events-none opacity-50 hover:translate-y-0',
    BUTTON_VARIANT_CLASSES[variant],
    BUTTON_SIZE_CLASSES[size],
    className,
  );
}
