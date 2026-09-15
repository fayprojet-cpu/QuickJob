# 02 — Modèle de données

La source de vérité est [`prisma/schema.prisma`](../prisma/schema.prisma).
Ce document explique les **décisions** derrière le schéma — surtout celles qui
sont coûteuses à changer plus tard. **C'est le point à valider en priorité.**

## Règles d'or appliquées

### 💰 Argent — pattern « Money »
Aucun montant n'est un `Float`. Chaque montant est un couple :

```
xxxAmount   BigInt   // valeur en UNITÉS MINEURES (centimes)
xxxCurrency String   // code ISO 4217 : "EUR", "USD", "XOF"…
```

- `BigInt` en unités mineures → zéro erreur d'arrondi flottant.
- La devise voyage **avec** le montant : rien n'est supposé « en euros ».
- Le nombre de décimales par devise vient du référentiel `Currency`
  (2 pour EUR/USD, 0 pour XOF/JPY…). Le formatage d'affichage est côté client
  selon la locale.

### 🌍 Géographie & langue — jamais figées
- Pays = code ISO 3166-1 alpha-2 (`countryCode`), jamais un nom en dur.
- Langue = locale BCP 47 (`locale`).
- Libellés (catégories, compétences) = `labelKey` (clé i18n), pas de texte figé.
- La config par pays vit dans `Market` + `SystemConfig` (voir plus bas).

### 🕐 Temps
Tout en UTC (`DateTime`). La conversion vers le fuseau utilisateur est côté
client (`timezone` stocké sur `User`).

## Configuration par marché — le cœur du « multi-pays »

| Table | Rôle |
|-------|------|
| `Market` | Un pays activé + ses défauts (devise, locale, actif ou non). |
| `SystemConfig` | Clé/valeur, `countryCode = NULL` = défaut global, sinon override par pays. |
| `FeatureFlag` | Activation progressive de fonctionnalités. |

Clés `SystemConfig` prévues (extensibles) : `commission_rate`, `min_salary`,
`payment_providers_enabled`, `supported_currencies`, `kyc_required`,
`withdrawal_min_amount`, `job_categories_visible`.

> Lecture : on résout une clé en prenant l'override pays s'il existe, sinon la
> valeur globale. Tout est éditable depuis l'admin, **sans redéploiement**.

## Cartographie modules → tables

| Module | Tables principales |
|--------|--------------------|
| Auth & identité | `User`, `OAuthAccount`, `RefreshToken`, `OtpCode`, `TwoFactor` |
| Profils & KYC | `WorkerProfile`, `RecruiterProfile`, `Skill`, `WorkerSkill`, `Experience`, `IdentityVerification` |
| Missions | `Job`, `JobCategory`, `JobSkill`, `JobPhoto`, `JobBoost` |
| Recherche & découverte | `SavedJob`, `JobAlert`, `SearchHistory` |
| Candidatures | `Application` |
| Messagerie | `Conversation`, `ConversationParticipant`, `Message` |
| Paiements & escrow | `Wallet`, `WalletTransaction`, `Payment`, `Escrow`, `Withdrawal`, `Invoice`, `Dispute`, `ExchangeRate` |
| Réputation | `Review`, `ReviewFlag` |
| Notifications | `Notification`, `NotificationPreference`, `DeviceToken` |
| IA / fraude | `MatchScore`, `EmbeddingRef`, `FraudSignal` |
| Admin / config | `Market`, `SystemConfig`, `FeatureFlag`, `AuditLog`, `Subscription` |
| Référentiels | `Currency`, `Country` |

## Décisions notables

- **Wallet par devise** : `Wallet` est unique par `(userId, currency)`. Un
  utilisateur multi-devises a plusieurs wallets — cohérent avec le multi-marché.
- **Grand livre append-only** : chaque mouvement de solde crée une
  `WalletTransaction` (avec `balanceAfter`). Traçabilité comptable totale ;
  le solde est toujours reconstituable.
- **Escrow lié 1-1 à une candidature acceptée** (`applicationId @unique`) et,
  optionnellement, à un `Payment`. `autoReleaseAt` porte la libération auto J+3.
- **Rotation des refresh tokens** : `tokenHash` (jamais en clair) +
  `replacedByTokenId` pour chaîner la rotation et détecter le rejeu.
- **Secrets/KYC** : on ne stocke que des URLs S3 (fichiers chiffrés côté
  stockage) et des hash ; le secret TOTP est chiffré (AES-256).
- **Embeddings hors base** : les vecteurs vivent dans Pinecone ;
  `EmbeddingRef` n'en garde qu'un pointeur.
- **Audit immuable** : `AuditLog` est append-only (aucune update/delete
  applicative) pour les actions sensibles (bans, libérations escrow, refunds).
- **RGPD** : `User.deletedAt` (soft delete) + procédure d'anonymisation ;
  export de données via un job dédié.
- **Géo** : `latitude`/`longitude` en `Decimal(9,6)` indexés ; la recherche
  par rayon s'appuie sur PostGIS (colonne géographique ajoutée par migration
  SQL) avec préfiltre bounding-box + Haversine.

## Ce que je te demande de valider

1. Le **pattern Money** (BigInt + code devise) te convient-il ? (recommandé, standard fintech)
2. Le **barème de matching** (30/25/20/15/10 + bonus) — on garde ces poids par défaut, ajustables ensuite ?
3. La **commission par défaut à 15 %**, configurable par marché — OK ?

Une fois ces trois points confirmés, je génère la première migration et
j'attaque le backend (auth → users → jobs).
