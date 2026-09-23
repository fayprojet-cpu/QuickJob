import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { buttonClasses, type ButtonSize, type ButtonVariant } from '@/lib/button-variants';

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Un lien qui a l'apparence d'un <Button> — sans imbriquer un <button> dans
 * un <a> (invalide en HTML, et source de confusion au clavier/lecteur
 * d'écran : deux arrêts de tabulation pour un seul contrôle visuel).
 * Remplace le motif `<Link href="..."><Button>...</Button></Link>`.
 */
export function LinkButton({ variant = 'primary', size = 'md', className, ...props }: LinkButtonProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
