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

    // SMTP optionnel : absent en dev -> MailService bascule sur un envoi
    // "console" (log le lien au lieu d'un vrai email), pratique sans
    // fournisseur SMTP local. Présent -> envoi réel (Gmail, Brevo, etc.).
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_SECURE: z.enum(['true', 'false']).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    // Envoi via l'API HTTP de Brevo (port 443) plutôt que SMTP (port 587) :
    // certains hébergeurs (Render notamment) bloquent les connexions SMTP
    // sortantes, ce qui fait échouer/traîner silencieusement l'envoi par
    // SMTP. Si présent, prioritaire sur SMTP_*.
    BREVO_API_KEY: z.string().optional(),

    // Paiement Mobile Money (FedaPay) — séquestre des missions. Absent =
    // PaymentsService refuse la création de transaction (503 explicite),
    // sans jamais bloquer le démarrage de l'API.
    FEDAPAY_PUBLIC_KEY: z.string().optional(),
    FEDAPAY_SECRET_KEY: z.string().optional(),
    FEDAPAY_ENVIRONMENT: z.enum(['sandbox', 'live']).default('sandbox'),
    // Rempli après coup : créé dans le tableau de bord FedaPay une fois
    // l'URL de webhook (déployée) connue. Actuellement PAS ENCORE lue par le
    // code (schéma de signature FedaPay non confirmé) : le webhook ne fait
    // jamais confiance au payload brut de toute façon, il revérifie toujours
    // le vrai statut via l'API avec FEDAPAY_SECRET_KEY. Cette variable est
    // donc inerte pour l'instant, pas un filet de sécurité manquant.
    FEDAPAY_WEBHOOK_SECRET: z.string().optional(),
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
