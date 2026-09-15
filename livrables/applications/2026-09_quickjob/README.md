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
| 4 | Backend NestJS (auth → users → jobs → …) | ⏳ prochaine tranche |
| 5 | Frontend web (Next.js, PWA, admin) | ⏳ |
| 6 | Maquettes UI | ⏳ |
| 7 | Docker & déploiement | ⏳ |
| 8 | Documentation complète | ⏳ |
| 9 | Données de seed | ⏳ |
| 10 | Roadmap & plan de lancement | ⏳ |

## Documents

- [`docs/01-architecture.md`](docs/01-architecture.md) — architecture, flux, scalabilité
- [`docs/02-data-model.md`](docs/02-data-model.md) — décisions du modèle de données
- [`docs/03-monorepo-structure.md`](docs/03-monorepo-structure.md) — arborescence du monorepo
- [`prisma/schema.prisma`](prisma/schema.prisma) — schéma complet (32 modèles)

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

## À valider avant la tranche backend

Trois décisions (détaillées dans `docs/02-data-model.md`) :
1. Pattern monétaire `BigInt` + code devise ISO.
2. Barème de matching (30/25/20/15/10 + bonus).
3. Commission par défaut 15 %, configurable par marché.
