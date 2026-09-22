/**
 * Nombre d'unités mineures d'une devise (2 pour EUR/USD, 0 pour XOF/JPY…) —
 * jamais de table codée en dur, `Intl.NumberFormat` connaît déjà cette règle
 * via les données ICU du runtime. Miroir de `apps/web/src/lib/money.ts`
 * côté API (pattern Money du projet : montants en unités mineures + devise).
 */
export function currencyMinorUnitDecimals(currency: string): number {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}
