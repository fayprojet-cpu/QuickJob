# Configurer la photo de profil (Supabase Storage)

QuickJob stocke les photos de profil dans **Supabase Storage** — le même
projet Supabase que celui qui héberge déjà la base de données (`DATABASE_URL`
dans `.env`). Pas besoin de créer un nouveau compte chez un autre
fournisseur.

## Comment ça marche

1. Sur son profil, l'utilisateur clique sur la petite icône caméra en bas de
   son avatar et choisit une photo (jpg, png ou webp, 5 Mo maximum).
2. `POST /users/me/avatar` envoie le fichier à l'API, qui le transmet à
   Supabase Storage et enregistre l'URL publique obtenue.
3. Cette même photo est réutilisée partout où la personne apparaît
   (messagerie, candidatures, fiche profil) — un seul avatar par compte,
   partagé entre le rôle travailleur et recruteur.

Sans `SUPABASE_SERVICE_ROLE_KEY`, `POST /users/me/avatar` répond `503` avec
un message clair au lieu de planter — le reste du site continue de
fonctionner normalement (avatar à initiale, comme aujourd'hui).

## Les 3 variables à renseigner

| Variable | Exemple | C'est quoi |
|---|---|---|
| `SUPABASE_URL` | `https://irrarmfiwzfqalealicu.supabase.co` | L'URL de ton projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Clé secrète — jamais exposée au navigateur |
| `SUPABASE_STORAGE_BUCKET` | `avatars` | Nom du "bucket" (dossier de stockage) — valeur par défaut déjà correcte |

## Où trouver ces informations

1. Connecte-toi sur [supabase.com](https://supabase.com) et ouvre ton projet
   (celui qui contient déjà la base de données QuickJob, "Travail rapide").
2. Menu de gauche → **Project Settings** (icône ⚙️ en bas) → **Data API**.
   L'URL affichée en haut ("Project URL") est ta `SUPABASE_URL`.
3. Toujours dans **Project Settings**, va dans **API Keys**. Trouve la clé
   nommée **`service_role`** (⚠️ pas la clé `anon`/`public`, qui n'a pas les
   droits nécessaires) et copie-la dans `SUPABASE_SERVICE_ROLE_KEY`.

## Créer le bucket de stockage (une seule fois)

1. Dans le menu de gauche de Supabase, clique sur **Storage**.
2. Clique sur **"New bucket"**.
3. Nom : `avatars` (doit correspondre exactement à `SUPABASE_STORAGE_BUCKET`).
4. Coche **"Public bucket"** (les photos de profil doivent être visibles par
   tout le monde, comme sur n'importe quelle appli professionnelle).
5. Valide.

## Où coller ces variables

### En local
Dans `.env` à la racine du projet (`livrables/applications/2026-09_quickjob/.env`,
jamais commité).

### En production (Render)
Dashboard Render → service `quickjob-api` → **Environment** → les 3
variables ci-dessus, puis **Save and deploy**.

## Vérifier que ça marche

1. Va sur ta page profil (`/profile/<ton-id>`), clique sur l'icône caméra et
   choisis une photo.
2. Elle doit apparaître immédiatement après l'envoi, et rester affichée
   après avoir rechargé la page.
3. Sans les 3 variables configurées : le bouton reste visible, mais l'envoi
   affiche un message d'erreur clair au lieu de planter le site.
