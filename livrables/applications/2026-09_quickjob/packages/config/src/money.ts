/**
 * Pattern « Money » partagé : un montant est toujours un couple
 * (BigInt en unités mineures, code devise ISO 4217). Jamais de Float.
 *
 * La liste des devises réellement activées par marché vit dans la table
 * `Currency` / `SystemConfig` (résolue au runtime) — ce module ne valide que
 * le FORMAT du code (3 lettres majuscules), pas son activation.
 */

export const ISO_4217_FORMAT = /^[A-Z]{3}$/;

export function isValidCurrencyFormat(code: string): boolean {
  return ISO_4217_FORMAT.test(code);
}

/** Chaîne décimale (ex. "12.50", saisie utilisateur) → unités mineures. */
export function toMinorUnits(decimalAmount: string, decimals: number): bigint {
  const trimmed = decimalAmount.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid decimal amount: "${decimalAmount}"`);
  }
  const [whole, fraction = ''] = trimmed.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const sign = whole.startsWith('-') ? -1n : 1n;
  const absWhole = whole.replace('-', '');
  const minorUnits = BigInt(absWhole) * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
  return sign * minorUnits;
}

/** Unités mineures → chaîne décimale, pour affichage/API (jamais de calcul dessus). */
export function fromMinorUnits(minorUnits: bigint, decimals: number): string {
  const negative = minorUnits < 0n;
  const abs = negative ? -minorUnits : minorUnits;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const fraction = (abs % divisor).toString().padStart(decimals, '0');
  const value = decimals > 0 ? `${whole}.${fraction}` : whole.toString();
  return negative ? `-${value}` : value;
}

export interface Money {
  amount: bigint;
  currency: string;
}
