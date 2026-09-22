'use client';

import { useEffect, useRef } from 'react';

/**
 * Résumé d'erreur de formulaire, focus automatiquement quand il apparaît —
 * sinon un utilisateur au clavier ou au lecteur d'écran peut ne jamais le
 * remarquer après un échec de soumission (cf. WCAG "Focusable Error Summary").
 */
export function FormError({ message }: { message?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (message) {
      ref.current?.focus();
    }
  }, [message]);

  if (!message) {
    return null;
  }

  return (
    <p
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 outline-none focus-visible:ring-2 focus-visible:ring-danger-500/40"
    >
      {message}
    </p>
  );
}
