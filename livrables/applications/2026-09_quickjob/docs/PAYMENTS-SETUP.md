# Configurer le paiement (séquestre Mobile Money — FedaPay)

QuickJob utilise [FedaPay](https://www.fedapay.com) pour encaisser le
paiement Mobile Money du recruteur quand il accepte un travailleur, et le
bloquer en séquestre jusqu'à ce que la mission soit marquée terminée.

## Comment ça marche

1. Le recruteur accepte une candidature (`PATCH /applications/:id/accept`,
   déjà existant) → la mission passe `IN_PROGRESS`.
2. Le recruteur finance le séquestre : `POST /applications/:id/fund`. L'API
   crée une transaction FedaPay et renvoie une `checkoutUrl`.
3. Le recruteur est redirigé vers cette URL — **la saisie du numéro et du
   code Mobile Money se fait entièrement sur la page sécurisée de FedaPay**,
   jamais sur QuickJob. QuickJob ne voit et ne stocke jamais ces informations.
4. FedaPay notifie QuickJob via un **webhook** (`POST
   /payments/webhook/fedapay`, public). QuickJob ne fait jamais confiance au
   contenu de ce webhook : il s'en sert uniquement pour retrouver
   l'identifiant de transaction, puis **revérifie le vrai statut auprès de
   l'API FedaPay** avec sa propre clé secrète avant de marquer quoi que ce
   soit comme payé.
5. Si confirmé : le `Payment` passe `CAPTURED` et l'`Escrow` passe `HELD`
   (argent bloqué). Si refusé/annulé : `Payment` passe `FAILED`, le
   recruteur peut refinancer.

## Les 4 variables à renseigner

| Variable | Exemple | C'est quoi |
|---|---|---|
| `FEDAPAY_PUBLIC_KEY` | `pk_live_...` ou `pk_sandbox_...` | Non utilisée côté API pour l'instant (utile si un jour le web appelle FedaPay directement) |
| `FEDAPAY_SECRET_KEY` | `sk_live_...` ou `sk_sandbox_...` | La clé qui compte — jamais exposée au navigateur |
| `FEDAPAY_ENVIRONMENT` | `live` ou `sandbox` | Doit correspondre au préfixe des clés (`pk_live_`/`sk_live_` → `live`) |
| `FEDAPAY_WEBHOOK_SECRET` | (vide au début) | Voir section "Créer le webhook" plus bas |

Sans `FEDAPAY_SECRET_KEY`, `POST /applications/:id/fund` répond `503` avec
un message clair au lieu de planter — le reste du site continue de
fonctionner normalement.

## Où trouver les clés

1. Connecte-toi sur [live.fedapay.com](https://live.fedapay.com).
2. Menu de gauche → **"Api"**.
3. Copie la **clé publique** et la **clé secrète** affichées.

## ⚠️ Compte non validé = pas de vrai paiement possible

Tant que le compte FedaPay affiche **"Compte: Non Validé"**, aucune
transaction réelle ne peut aboutir — FedaPay l'exige pour toute plateforme
qui fait circuler de l'argent réel (vérification anti-fraude standard, pas
propre à QuickJob). Pour valider :

1. Terminer le formulaire **"Activer mon compte"** dans le tableau de bord
   FedaPay (infos entreprise + documents).
2. Il faut un **numéro RCCM** (registre du commerce). Si QuickJob n'est pas
   encore enregistré comme entreprise, ça se fait en ligne sur
   [monentreprise.bj](https://monentreprise.bj) (Bénin) — environ 10 000
   FCFA, souvent traité en moins d'une heure une fois le dossier complet.

Le code est déjà prêt à recevoir de vrais paiements dès que le compte est
validé — rien à reconstruire, juste laisser tourner avec les mêmes clés
(ou les régénérer si FedaPay le demande après validation).

## Créer le webhook (après déploiement)

Une fois l'API déployée sur Render avec une vraie URL publique :

1. Dans le tableau de bord FedaPay, menu de gauche → **"Webhooks"**.
2. Ajoute une URL : `https://<ton-api-render>.onrender.com/payments/webhook/fedapay`.
3. FedaPay affiche un secret propre à cet endpoint — copie-le dans
   `FEDAPAY_WEBHOOK_SECRET` (Render → Environment).

Tant que ce secret n'est pas renseigné, le webhook fonctionne quand même
(il revérifie toujours le vrai statut via l'API FedaPay avant d'agir) —
c'est une sécurité en plus, pas une dépendance bloquante.

## Où coller ces variables

### En local
Dans `.env` à la racine du projet (`livrables/applications/2026-09_quickjob/.env`,
jamais commité).

### En production (Render)
Dashboard Render → service `quickjob-api` → **Environment** → les 4
variables ci-dessus, puis **Save and deploy**.

## Vérifier que ça marche

1. `POST /applications/:id/fund` sur une candidature acceptée avec un
   montant renseigné (pas "à négocier") doit renvoyer une `checkoutUrl`.
2. Sans `FEDAPAY_SECRET_KEY` configurée : la même requête doit renvoyer une
   erreur `503` claire, pas un plantage.
3. Un vrai test de paiement (petit montant) ne doit être tenté **qu'une fois
   le compte FedaPay validé** — avant ça, FedaPay refusera de toute façon la
   transaction côté leur API.
