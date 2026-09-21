/**
 * Devises proposées à la publication. Liste volontairement large (la plateforme
 * est universelle) — l'Afrique de l'Ouest/Centrale d'abord, puis les grandes
 * devises. On stocke le code ISO 4217 ; le nom lisible est produit par
 * Intl.DisplayNames dans la langue de l'utilisateur (pas de traduction en dur).
 * À terme, cette liste pourra venir de la config du marché.
 */
export const CURRENCY_CODES: readonly string[] = [
  'XOF', // Franc CFA (Afrique de l'Ouest)
  'XAF', // Franc CFA (Afrique centrale)
  'NGN',
  'GHS',
  'GNF',
  'MAD',
  'DZD',
  'TND',
  'EGP',
  'KES',
  'ZAR',
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'CHF',
  'CNY',
  'INR',
  'BRL',
];

/** Libellé lisible d'une devise dans la langue donnée, ex. "franc CFA (BCEAO) (XOF)". */
export function currencyLabel(code: string, locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'currency' }).of(code);
    return name && name !== code ? `${name} (${code})` : code;
  } catch {
    return code;
  }
}
