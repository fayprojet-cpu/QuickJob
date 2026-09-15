import type { StringValue } from 'ms';

const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

/** Parse une durée courte ("15m", "7d", "1h") vers des millisecondes. */
export function parseDurationMs(duration: string): number {
  const match = /^(\d+)(s|m|h|d|w)$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}" (expected e.g. "15m", "7d")`);
  }
  const [, value, unit] = match;
  return Number(value) * UNIT_TO_MS[unit];
}

/**
 * Convertit une durée déjà validée par `envSchema` (format `\d+(s|m|h|d|w)`)
 * vers le type `StringValue` attendu par `jsonwebtoken`/`@nestjs/jwt`.
 */
export function asJwtDuration(duration: string): StringValue {
  return duration as StringValue;
}
