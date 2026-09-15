# 03 — Structure du monorepo

Monorepo géré par **pnpm workspaces + Turborepo**. Un seul dépôt, plusieurs
apps et packages partagés (types, client API, i18n, config) → cohérence
parfaite web ↔ mobile, zéro duplication.

```
quickjob/
├── apps/
│   ├── api/                    # Backend NestJS (REST + WebSockets + workers)
│   │   ├── src/
│   │   │   ├── main.ts                 # bootstrap (Swagger, helmet, CORS, i18n)
│   │   │   ├── app.module.ts
│   │   │   ├── common/                 # guards, interceptors, filters, decorators
│   │   │   │   ├── guards/             # JwtAuthGuard, RolesGuard, RateLimitGuard
│   │   │   │   ├── interceptors/       # LoggingInterceptor, TransformInterceptor
│   │   │   │   ├── filters/            # AllExceptionsFilter (erreurs localisées)
│   │   │   │   └── decorators/         # @CurrentUser, @Roles, @Market
│   │   │   ├── config/                 # ConfigModule, validation env (Zod)
│   │   │   ├── infra/                  # adapters interchangeables (ports & adapters)
│   │   │   │   ├── payments/           # PaymentProvider + Stripe/PayPal/MobileMoney…
│   │   │   │   ├── storage/            # StorageProvider + S3/R2/MinIO
│   │   │   │   ├── sms/                # SmsProvider + Twilio
│   │   │   │   ├── email/              # EmailProvider + SendGrid
│   │   │   │   ├── push/               # PushProvider + FCM/OneSignal
│   │   │   │   ├── fx/                 # taux de change (provider configurable)
│   │   │   │   └── ai/                 # OpenAI embeddings + Pinecone
│   │   │   ├── modules/                # 1 dossier = 1 domaine métier
│   │   │   │   ├── auth/               #   *.module | *.controller | *.service
│   │   │   │   ├── users/              #   *.dto | *.entity | *.spec.ts
│   │   │   │   ├── profiles/
│   │   │   │   ├── kyc/
│   │   │   │   ├── jobs/
│   │   │   │   ├── categories/
│   │   │   │   ├── search/
│   │   │   │   ├── applications/
│   │   │   │   ├── geo/
│   │   │   │   ├── chat/               # Socket.io gateway + REST historique
│   │   │   │   ├── payments/
│   │   │   │   ├── wallet/
│   │   │   │   ├── escrow/
│   │   │   │   ├── withdrawals/
│   │   │   │   ├── reviews/
│   │   │   │   ├── notifications/
│   │   │   │   ├── matching/           # MatchingService (barème pur, testable)
│   │   │   │   ├── fraud/
│   │   │   │   ├── admin/
│   │   │   │   ├── config/             # Market + SystemConfig (résolution par marché)
│   │   │   │   └── audit/
│   │   │   ├── queues/                 # définitions BullMQ + processors
│   │   │   └── i18n/                   # messages d'erreur localisés (nestjs-i18n)
│   │   ├── test/                       # tests e2e (Jest + Supertest)
│   │   ├── Dockerfile                  # multi-stage
│   │   └── package.json
│   │
│   ├── web/                    # Frontend Next.js 14 (App Router) + PWA + Admin
│   │   ├── src/
│   │   │   ├── app/                    # routes (App Router, Server Components)
│   │   │   │   ├── [locale]/           # segment i18n (next-intl)
│   │   │   │   │   ├── (worker)/       # espace travailleur
│   │   │   │   │   ├── (recruiter)/    # espace recruteur
│   │   │   │   │   ├── (auth)/         # connexion / inscription / OTP
│   │   │   │   │   └── admin/          # dashboard admin
│   │   │   │   └── api/                # route handlers (BFF léger si besoin)
│   │   │   ├── components/             # UI (Shadcn/UI) + composants métier
│   │   │   ├── features/              # logique par domaine (jobs, chat, wallet…)
│   │   │   ├── hooks/                  # hooks personnalisés
│   │   │   ├── stores/                 # Zustand
│   │   │   ├── lib/                    # client API typé, utils, providers
│   │   │   └── styles/                 # Tailwind + tokens de design
│   │   ├── messages/                   # traductions JSON (fr.json, en.json, …)
│   │   ├── public/                     # manifest PWA, icônes, service worker
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── mobile/                 # React Native + Expo (phase suivante)
│       ├── app/                        # Expo Router
│       ├── src/                        # components, hooks, stores, lib
│       ├── assets/
│       └── package.json
│
├── packages/                   # code partagé (typé, versionné)
│   ├── types/                          # types de domaine partagés API ↔ clients
│   ├── api-client/                     # client HTTP + WS typé (généré depuis OpenAPI)
│   ├── i18n/                           # clés + locales partagées + helpers
│   ├── config/                         # constantes non régionales, schémas Zod partagés
│   ├── ui/                             # design tokens partagés (optionnel web/mobile)
│   └── tsconfig/                       # configs TypeScript de base
│
├── prisma/                     # schéma + migrations + seed
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── infra/                      # Infrastructure as Code & déploiement
│   ├── docker/                         # nginx.conf, entrypoints
│   ├── terraform/                      # AWS (ECS/RDS/ElastiCache/S3/CloudFront)
│   └── k8s/                            # manifests Kubernetes (prod)
│
├── .github/workflows/          # CI/CD (lint, typecheck, test, build, scan, deploy)
├── docker-compose.yml          # infra locale (Postgres, Redis, MinIO, Adminer)
├── docker-compose.prod.yml
├── turbo.json                  # pipeline Turborepo
├── pnpm-workspace.yaml
├── package.json                # racine (scripts orchestrés)
├── tsconfig.base.json
├── .env.example                # toutes les variables commentées
└── README.md
```

## Conventions

- **1 module = 1 domaine** : `*.module.ts`, `*.controller.ts`, `*.service.ts`,
  `*.dto.ts`, `*.spec.ts`. Fonctions < 50 lignes, responsabilité unique.
- **Composants React < 200 lignes**, typés strictement (`no any`).
- **Nommage** : `camelCase` en TS, `snake_case` en base (via `@@map`/`@map`).
- **Ports & adapters** : le métier importe des interfaces depuis `infra/*`,
  jamais un SDK provider directement.
- **Partage** : tout ce qui est commun (types, client API, i18n) vit dans
  `packages/*` et est consommé par `web` et `mobile`.

## Où on en est / prochaine étape

Cette étape livre les **fondations** (`prisma/`, `docs/`, ce plan de structure).
La tranche suivante matérialise `apps/api` (auth → users → jobs) avec la config
racine du monorepo (`package.json`, `turbo.json`, `pnpm-workspace.yaml`) et une
première migration Prisma exécutable.
