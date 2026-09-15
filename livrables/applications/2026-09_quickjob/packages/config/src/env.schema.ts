import { z } from 'zod';

/** Format court "<entier><unité>" (s/m/h/d/w), ex. "15m", "7d". */
const DURATION_FORMAT = /^\d+(s|m|h|d|w)$/;

/**
 * Variables d'environnement effectivement consommées par le backend à ce
 * stade (auth/users/jobs). Les autres clés de `.env.example` (paiements,
 * SMS, stockage…) seront validées au fur et à mesure que leurs modules
 * `infra/*` seront câblés — on ne bloque pas le démarrage sur des secrets
 * pas encore utilisés.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().positive().default(4000),
    WEB_URL: z.url(),
    API_URL: z.url(),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_TTL: z.string().regex(DURATION_FORMAT, 'expected format like "15m" or "7d"').default('15m'),
    JWT_REFRESH_TTL: z.string().regex(DURATION_FORMAT, 'expected format like "15m" or "7d"').default('7d'),
  })
  .loose();

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
