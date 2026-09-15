# 01 — Architecture système

> QuickJob — plateforme universelle de travail temporaire. Un seul codebase,
> une infinité de marchés. Rien de géographique, monétaire ou linguistique
> n'est figé dans le code : tout se configure par marché depuis l'admin.

## 1. Vue d'ensemble

```mermaid
flowchart TB
    subgraph Clients
      W["Web — Next.js 14<br/>(PWA + Admin)"]
      M["Mobile — React Native / Expo"]
    end

    subgraph Edge
      CDN["CloudFront CDN"]
      NGINX["Nginx<br/>reverse proxy + TLS"]
    end

    subgraph API["API — NestJS (modulaire)"]
      REST["REST + Swagger/OpenAPI"]
      WS["Socket.io Gateway<br/>(chat, présence, temps réel)"]
      JOBS["Workers BullMQ<br/>(matching, notifs, paiements)"]
    end

    subgraph Data
      PG[("PostgreSQL 16<br/>+ PostGIS")]
      REDIS[("Redis 7<br/>cache · sessions · files")]
      S3[("S3 / R2<br/>fichiers · photos · KYC")]
      VEC[("Pinecone<br/>vector DB")]
    end

    subgraph Providers["Intégrations abstraites (interchangeables)"]
      PAY["Paiements<br/>Stripe · PayPal · Mobile Money · SEPA/SWIFT"]
      SMS["SMS — Twilio*"]
      MAIL["Email — SendGrid*"]
      PUSH["Push — FCM · OneSignal"]
      FX["Taux de change"]
      AI["OpenAI (embeddings)"]
    end

    W & M --> CDN --> NGINX --> REST
    W & M -. websocket .-> NGINX --> WS
    REST --> PG & REDIS & S3
    WS --> REDIS
    JOBS --> PG & REDIS & VEC
    REST --> Providers
    JOBS --> Providers
    AI --> VEC
```

Chaque intégration externe (paiement, SMS, email, push, stockage, taux de
change) est derrière une **interface TypeScript**. Le provider par défaut
(marqué `*`) se remplace par configuration, sans toucher au code métier.

## 2. Principes d'architecture

| Principe | Mise en œuvre |
|----------|---------------|
| **Modulaire** | Chaque domaine métier = un module NestJS isolé (auth, jobs, payments…). |
| **Ports & adapters** | Le métier dépend d'interfaces (`PaymentProvider`, `SmsProvider`…), pas d'implémentations concrètes. |
| **Config par marché** | `Market` + `SystemConfig` (clé/valeur, override par pays) lus au runtime. Aucun redéploiement pour changer une commission ou activer un provider. |
| **Stateless API** | Aucune session en mémoire : JWT + Redis. Scalable horizontalement derrière un load balancer. |
| **Asynchrone** | Tout ce qui est lourd (matching IA, notifications, génération de factures, libération escrow) passe par des files BullMQ. |
| **Temps réel** | Socket.io avec adapter Redis (multi-instances). |
| **Sécurité par défaut** | Validation double (client + serveur), rate limiting, chiffrement des données sensibles, audit log immuable. |

## 3. Flux critique — le cœur métier (escrow)

```mermaid
sequenceDiagram
    participant R as Recruteur
    participant API
    participant PAY as Provider paiement
    participant ESC as Escrow (DB)
    participant Q as BullMQ
    participant W as Worker

    R->>API: Accepte une candidature
    API->>PAY: Débit (montant + commission)
    PAY-->>API: Paiement capturé
    API->>ESC: Escrow = HELD, autoReleaseAt = J+3
    API->>Q: Ouvre la conversation + notifie le worker
    Note over R,W: Mission réalisée
    R->>API: Valide la mission
    API->>ESC: RELEASED → crédite le wallet du worker (net de commission)
    API->>Q: Notifie · génère facture · invite aux avis
    Note over API,ESC: Sans action à J+3 → libération automatique (worker BullMQ)
```

En cas de litige : `Escrow → DISPUTED`, médiation admin, résolution en
`RESOLVED_RELEASE` / `RESOLVED_REFUND` / `RESOLVED_PARTIAL`.

## 4. Flux de matching (IA)

```mermaid
flowchart LR
    NJ["Nouvelle mission publiée"] --> EMB["Embedding OpenAI → Pinecone"]
    EMB --> CAND["Présélection sémantique<br/>(top candidats proches)"]
    CAND --> SCORE["Scoring multi-critères"]
    SCORE --> TOP["Top 10 workers"]
    TOP --> NOTIF["Notification push (BullMQ)"]

    subgraph Scoring["Barème (100 pts)"]
      direction TB
      s1["Distance — 30"]
      s2["Compétences — 25"]
      s3["Note moyenne — 20"]
      s4["Score de confiance — 15"]
      s5["Taux de complétion — 10"]
      s6["+ bonus ancienneté / volume"]
    end
```

Le barème est un service pur et testable (`MatchingService`), le résultat est
mis en cache dans `MatchScore`.

## 5. Découpage en modules NestJS

`auth` · `users` · `profiles` · `kyc` · `jobs` · `categories` · `search` ·
`applications` · `geo` · `chat` · `payments` · `wallet` · `escrow` ·
`withdrawals` · `reviews` · `notifications` · `matching` · `fraud` ·
`admin` · `config` (Market/SystemConfig) · `i18n` · `audit`.

Modules transverses (infra) : `PaymentProviderModule`, `StorageModule`,
`SmsModule`, `EmailModule`, `PushModule`, `FxModule` — chacun expose une
interface + une implémentation par défaut sélectionnée par config.

## 6. Scalabilité & déploiement

```mermaid
flowchart TB
    LB["AWS ALB"] --> APIn["API x N (ECS/K8s, autoscaling)"]
    LB --> WEBn["Web SSR x N"]
    APIn --> RDS[("RDS PostgreSQL<br/>primary + read replicas")]
    APIn --> EC[("ElastiCache Redis")]
    WKR["Workers BullMQ x N"] --> RDS & EC
    APIn --> S3B[("S3")] --> CF["CloudFront"]
```

- **Horizontal** : API, web SSR et workers sont stateless → réplication libre.
- **Base** : réplicas de lecture pour la recherche/analytics ; PgBouncer.
- **Cache** : Redis pour sessions, cache de config marché, files, présence.
- **CI/CD** : GitHub Actions (lint → typecheck → tests → build → scan sécurité
  → image Docker → déploiement). IaC via Terraform.
- **Observabilité** : Sentry (erreurs), Datadog/Grafana (métriques), logs JSON
  structurés, LogRocket (session replay web).

## 7. Multi-marché en un déploiement

Ajouter un marché = créer un `Market` + ses `SystemConfig` depuis l'admin
(devise(s), commission, providers actifs, KYC requis, catégories visibles).
Ajouter une langue = déposer un fichier de traduction JSON. Ajouter un
provider de paiement = implémenter l'interface `PaymentProvider`. **Aucun de
ces trois gestes ne nécessite de modifier la logique métier.**
```

Voir `docs/03-monorepo-structure.md` pour la traduction en dossiers.
