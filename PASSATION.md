# 📋 Passation — reprendre QuickJob sur ton PC (VS Code + Claude Code)

> Ce fichier récapitule **tout ce qui est déjà en place** et te donne la
> marche à suivre pour continuer le travail depuis ton ordinateur.
> Dernière mise à jour : 2026-09-15.

---

## 1. Où est le travail

- **Dépôt GitHub** : `https://github.com/fayprojet-cpu/QuickJob`
- **Branche de travail** : `claude/workspace-setup-secrets-bqoc8s`
- Tout ce qui suit est **déjà commité et poussé** sur cette branche.

---

## 2. Ce qui est déjà en place

### a) Organisation du workspace (`livrables/` + `context/import/`)
Rangement des livrables par thème, avec le flux **inputs → livrables**.

```
livrables/            → ce que je produis (par thème : sites-web, applications,
                        youtube, cabinet [Chatflow], ecole [Adreneur Académie])
context/import/       → ce que tu me fournis (mêmes thèmes, mêmes noms de projet)
```
Convention de nommage des projets : `AAAA-MM_nom-du-projet` (kebab-case).
Détails : `livrables/README.md`.

### b) Gestion des secrets (racine du workspace)
- `.env` → tes **vraies clés d'API** (Anthropic, OpenAI, Notion, Google,
  YouTube, Vercel, GitHub, Stripe). **JAMAIS commité.**
- `.env.example` → template public, mêmes variables sans valeurs.
- `.gitignore` → exclut `.env` & variantes, secrets (`*key`, `*.pem`),
  `node_modules/`, builds, fichiers d'éditeur, logs, temporaires.

> ⚠️ **Important** : le `.env` avec tes vraies clés **n'est pas** dans Git
> (c'est voulu, pour la sécurité). Sur ton PC tu devras le **recréer** à partir
> de `.env.example` (voir §4).

### c) Projet QuickJob — fondations (livrables #1-3 du brief)
Dans `livrables/applications/2026-09_quickjob/` :

| Fichier | Contenu |
|---------|---------|
| `README.md` | Vue d'ensemble + tableau d'avancement |
| `docs/01-architecture.md` | Architecture système + diagrammes (escrow, matching, scalabilité) |
| `prisma/schema.prisma` | **Schéma complet — 32 modèles**, tous les 12 modules |
| `docs/02-data-model.md` | Décisions du modèle de données |
| `docs/03-monorepo-structure.md` | Arborescence pnpm + Turborepo |
| `docker-compose.yml` | Infra locale : Postgres 16 + PostGIS, Redis 7, MinIO, Adminer |
| `.env.example` | Variables de l'app (providers interchangeables) |

**Décisions verrouillées** (issues du brief, modifiables sur demande) :
1. Argent = pattern *Money* : `BigInt` (unités mineures) + code devise ISO.
2. Barème de matching : 30 / 25 / 20 / 15 / 10 + bonus ancienneté/volume.
3. Commission par défaut : 15 %, configurable par marché.

---

## 3. Prérequis à installer sur le PC

- **Git**
- **Node.js** 20+ et **pnpm** (`npm i -g pnpm`)
- **Docker Desktop** (pour l'infra locale Postgres/Redis)
- **VS Code** + l'extension **Claude Code**

---

## 4. Récupérer le travail sur ton PC

```bash
# 1. Cloner le dépôt
git clone https://github.com/fayprojet-cpu/QuickJob.git
cd QuickJob

# 2. Se placer sur la branche de travail
git checkout claude/workspace-setup-secrets-bqoc8s

# 3. Recréer le fichier de secrets (racine du workspace)
cp .env.example .env
#   → ouvre .env et colle tes vraies clés d'API

# 4. (Projet QuickJob) préparer son propre .env et démarrer l'infra
cd livrables/applications/2026-09_quickjob
cp .env.example .env
docker compose up -d          # Postgres + Redis + MinIO + Adminer
```

Ouvre ensuite le dossier `QuickJob` dans **VS Code**.

---

## 5. Reprendre avec Claude Code dans VS Code

Ouvre Claude Code dans VS Code et colle ce **prompt de reprise** :

```
Tu reprends le projet QuickJob (plateforme universelle de travail temporaire).
Contexte déjà en place, à lire d'abord :
- PASSATION.md (ce récap)
- livrables/applications/2026-09_quickjob/README.md
- livrables/applications/2026-09_quickjob/docs/01-architecture.md
- livrables/applications/2026-09_quickjob/docs/02-data-model.md
- livrables/applications/2026-09_quickjob/docs/03-monorepo-structure.md
- livrables/applications/2026-09_quickjob/prisma/schema.prisma

État : fondations livrées (architecture, schéma Prisma 32 modèles, structure
monorepo, docker-compose, .env.example). On construit par tranches verticales,
backend + web d'abord, mobile ensuite. Rien de géographique/monétaire/
linguistique n'est hardcodé : tout est config par marché (Market + SystemConfig).

Décisions verrouillées : Money = BigInt + code ISO ; barème matching
30/25/20/15/10 + bonus ; commission par défaut 15 % configurable par marché.

Prochaine tranche à réaliser : le BACKEND CORE —
1. config racine du monorepo (package.json, turbo.json, pnpm-workspace.yaml,
   tsconfig.base.json)
2. première migration Prisma exécutable + seed minimal
3. modules NestJS auth → users → jobs (DTOs + validation class-validator,
   services, controllers documentés Swagger, guards, tests Jest)
Règles qualité : TypeScript strict (no any), pas de secret hardcodé, validation
client + serveur, fonctions < 50 lignes, composants < 200 lignes, du code réel
et exécutable (pas de placeholder ni "à compléter").

Commence par la config racine + la migration, puis le module auth.
```

---

## 6. Commandes utiles (rappel)

```bash
# Voir l'état du repo
git status
git log --oneline -5

# Récupérer les dernières modifs (si tu travailles à plusieurs endroits)
git pull origin claude/workspace-setup-secrets-bqoc8s

# Sauvegarder ton travail
git add -A
git commit -m "..."
git push origin claude/workspace-setup-secrets-bqoc8s

# Infra locale QuickJob
cd livrables/applications/2026-09_quickjob
docker compose up -d      # démarrer
docker compose ps         # état
docker compose down       # arrêter
```

---

## 7. Prochaines tranches (feuille de route courte)

1. **Backend core** — auth, users, jobs (⟵ on est ici)
2. Modules paiements/escrow/wallet + matching IA
3. Frontend web Next.js (PWA + dashboard admin)
4. Maquettes UI des écrans clés
5. Docker prod + CI/CD GitHub Actions
6. Seed de démo + documentation complète
7. App mobile Expo (réutilise l'API + types partagés)

---

*Tout est déjà sur la branche `claude/workspace-setup-secrets-bqoc8s`. Il te
suffit de cloner, recréer ton `.env`, et reprendre. Bon travail !*
