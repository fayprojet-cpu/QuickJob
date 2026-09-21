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

/** Nombre de décimales d'une devise (2 pour EUR/USD, 0 pour XOF/JPY…). */
export function currencyDecimals(currency: string, locale = 'en'): number {
  try {
    return (
      new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/**
 * Convertit un montant "humain" (ce que l'utilisateur tape, ex. "1000" ou
 * "1000,50") en unités mineures (centimes) selon la devise. Renvoie null si le
 * champ est vide ou invalide. Accepte la virgule OU le point comme séparateur.
 */
export function toMinorUnits(amount: string, currency: string, locale = 'en'): string | null {
  const normalized = amount.replace(/\s/g, '').replace(',', '.').trim();
  if (!normalized) {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  const minor = Math.round(value * 10 ** currencyDecimals(currency, locale));
  return String(minor);
}
