import { parseEnv, type Env } from '@quickjob/config';

/** Passé à `ConfigModule.forRoot({ validate })` — échoue vite si un secret manque. */
export function validateEnv(raw: Record<string, unknown>): Env {
  return parseEnv(raw as Record<string, string | undefined>);
}
