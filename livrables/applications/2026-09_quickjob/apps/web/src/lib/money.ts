/**
 * Formate un montant "Money" (unités mineures + code devise ISO) sans jamais
 * coder en dur le nombre de décimales par devise : `Intl.NumberFormat`
 * connaît déjà cette règle (0 pour XOF/JPY, 2 pour EUR/USD…) via les données
 * ICU du runtime — on la réutilise plutôt que de dupliquer un référentiel.
 */
export function formatMoney(minorUnits: string, currency: string, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const decimals = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const value = Number(BigInt(minorUnits)) / 10 ** decimals;
  return formatter.format(value);
}
