# QuickJob

> **« Trouve un travail aujourd'hui. Sois payé aujourd'hui. »**
> Plateforme universelle de travail temporaire et informel — web + mobile,
> multi-pays, multi-devises, multi-provider de paiement. Un seul codebase,
> une infinité de marchés.

## Principe fondateur

Rien de géographique, monétaire ou linguistique n'est figé dans le code. Tout
(langue, devise, providers de paiement, catégories de métiers, commissions,
règles KYC) se configure **par marché depuis l'admin, sans redéploiement**.

## État d'avancement

On construit **par tranches verticales réelles** (du vrai code qui tourne à
chaque étape), pas en un bloc superficiel. Ordre retenu : **fondations →
backend → web (PWA + admin) → mobile**.

| # | Livrable | État |
|---|----------|------|
| 1 | Architecture système | ✅ `docs/01-architecture.md` |
| 2 | Schéma base de données (Prisma) | ✅ `prisma/schema.prisma` + `docs/02-data-model.md` |
| 3 | Structure du monorepo | ✅ `docs/03-monorepo-structure.md` |
| 4 | Backend NestJS (auth → users → jobs) | ✅ voir `apps/api/` — payments/escrow/matching restent à faire |
| 5 | Frontend web (Next.js, PWA, admin) | ✅ voir `apps/web/` — inscription/connexion/missions ; PWA, admin et paiements restent à faire |
| 6 | Maquettes UI | ⏳ |
| 7 | Docker & déploiement | 🟡 `apps/api/Dockerfile` + `render.yaml` prêts, section "Déploiement" ci-dessous — pas encore déployé en ligne |
| 8 | Documentation complète | ⏳ |
| 9 | Données de seed | ✅ `prisma/seed.ts` (référentiels minimaux, idempotent) |
| 10 | Roadmap & plan de lancement | ⏳ |

## Documents

- [`docs/01-architecture.md`](docs/01-architecture.md) — architecture, flux, scalabilité
- [`docs/02-data-model.md`](docs/02-data-model.md) — décisions du modèle de données
- [`docs/03-monorepo-structure.md`](docs/03-monorepo-structure.md) — arborescence du monorepo
- [`prisma/schema.prisma`](prisma/schema.prisma) — schéma complet (46 modèles)

## Backend (`apps/api`)

NestJS, modules `auth` (register/login/refresh/logout, rotation des refresh
tokens), `users` (profil courant) et `jobs` (CRUD recruteur + liste publique).
Swagger sur `/docs` une fois le serveur démarré.

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:deploy      # applique la migration (Postgres doit tourner)
pnpm prisma:seed        # référentiels minimaux
pnpm --filter @quickjob/api start:dev
```

Nest est fixé en 11.x (12.x publie des modules ESM purs, incompatibles avec
Jest/ts-jest en CommonJS) et Prisma en 6.19.x (Prisma 7 a supprimé
`datasource.url` dans le schema au profit d'un `prisma.config.ts` avec
adapters — migration non faite ici pour ne pas toucher au schéma déjà validé).

## Frontend web (`apps/web`)

Next.js 14 (App Router), i18n FR/EN (`next-intl`), Tailwind (palette orange
`#FF5722`, mobile-first). Écrans : accueil, inscription, connexion, liste des
missions (filtres + pagination, SSR), détail d'une mission, publication d'une
mission (réservé aux comptes recruteur).

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @quickjob/web dev
```

Auth gérée côté client (Zustand persisté + refresh automatique du token) car
Next 14 ne peut pas lire le `localStorage` côté serveur ; les pages missions
(liste/détail) sont rendues côté serveur, la publication est un formulaire
client. Aucune décimale de devise n'est codée en dur : le formatage monétaire
s'appuie sur `Intl.NumberFormat`. Les paiements sont une tranche ultérieure.

## Stack (imposée)

Next.js 14 · React Native/Expo · NestJS · Prisma · PostgreSQL 16 · Redis 7 ·
Socket.io · BullMQ · Tailwind + Shadcn/UI · Zustand · TanStack Query ·
next-intl · Docker/K8s · AWS · Terraform · GitHub Actions.

## Démarrer l'infra locale

```bash
cp .env.example .env        # renseigner les variables (voir en-tête du fichier)
docker compose up -d        # Postgres 16 + Redis 7 + MinIO + Adminer
```

> ⚠️ Les vraies clés d'API vont dans le `.env` **racine du workspace**
> (déjà ignoré par Git). Ne jamais committer de secret.

## Déploiement (production)

API sur **Render** ou **Railway** (Docker), web sur **Vercel**, base sur
**Supabase**. Déployer l'API en premier (le web a besoin de son URL).

### 1. Base de données — Supabase

Déjà fait pour l'environnement de démo actuel (projet "Travail rapide").
Pour un nouveau projet Supabase : Project Settings → Database → copier le
**pooler de session** (port 5432, PAS la "Direct connection" — son hostname
`db.<ref>.supabase.co` ne résout qu'en IPv6, souvent injoignable depuis les
plateformes de déploiement/CI). Utiliser cette même URL pooler pour
`DATABASE_URL` **et** `DIRECT_URL`.

### 2. API — Render ou Railway

Un `Dockerfile` multi-stage (`apps/api/Dockerfile`) construit `packages/config`
puis `apps/api` via `pnpm deploy` (sort un `node_modules` autonome, sans les
symlinks du store pnpm — seule méthode fiable pour un package pris dans un
monorepo pnpm). Au démarrage du conteneur : `prisma migrate deploy` puis
`node dist/main.js`. Écoute sur `process.env.PORT` (imposé par ces
plateformes) avec repli sur `API_PORT` en local.

**Render** : "New +" → "Blueprint" → sélectionner ce repo → Render détecte
`render.yaml` à la racine du projet automatiquement. Remplir les variables
marquées "à saisir" dans le dashboard (voir liste ci-dessous).

**Railway** : "New Project" → "Deploy from GitHub repo" → sélectionner ce
repo → dans Settings du service : **Root Directory** =
`livrables/applications/2026-09_quickjob`, **Dockerfile Path** =
`apps/api/Dockerfile`. Ajouter les variables d'environnement manuellement
(Railway n'a pas d'équivalent `render.yaml`).

Variables d'environnement à définir sur la plateforme choisie :

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | pooler Supabase (session, port 5432) |
| `DIRECT_URL` | identique à `DATABASE_URL` |
| `JWT_ACCESS_SECRET` | secret aléatoire dédié prod (≥32 car.) |
| `JWT_REFRESH_SECRET` | secret aléatoire dédié prod (≥32 car., différent du précédent) |
| `JWT_ACCESS_TTL` | `15m` |
| `JWT_REFRESH_TTL` | `7d` |
| `WEB_URL` | URL Vercel du site (étape 3 — à mettre à jour après coup) |
| `API_URL` | URL publique de ce service API une fois déployé |

> Ne jamais réutiliser les secrets JWT du `.env` de dev en production.
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
> en génère un nouveau à chaque appel.

### 3. Web — Vercel

"Add New" → "Project" → importer ce repo → **Root Directory** =
`livrables/applications/2026-09_quickjob/apps/web` (Vercel détecte Next.js
automatiquement). Variable d'environnement :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL de l'API déployée à l'étape 2 |

### 4. Boucler CORS

Une fois le web déployé, retourner dans les variables d'env de l'API et
mettre à jour `WEB_URL` avec l'URL Vercel finale (CORS n'autorise qu'une
seule origine), puis redéployer/redémarrer le service API.

## À valider avant la tranche backend

Trois décisions (détaillées dans `docs/02-data-model.md`) :
1. Pattern monétaire `BigInt` + code devise ISO.
2. Barème de matching (30/25/20/15/10 + bonus).
3. Commission par défaut 15 %, configurable par marché.
