# Configurer l'envoi d'email (mot de passe oublié)

QuickJob envoie un vrai email quand quelqu'un clique sur "mot de passe
oublié". Pour ça, il faut un compte SMTP — c'est gratuit et prend 5 minutes.
**Sans ces réglages, l'API fonctionne quand même** : le lien de
réinitialisation est juste affiché dans les logs du serveur au lieu d'être
envoyé par email (pratique pour développer en local sans rien configurer).

## Les 6 variables à renseigner

| Variable | Exemple | C'est quoi |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | L'adresse du serveur d'envoi |
| `SMTP_PORT` | `587` | Le port (587 dans presque tous les cas) |
| `SMTP_SECURE` | `false` | `true` seulement si tu utilises le port 465 |
| `SMTP_USER` | ton adresse email | Identifiant de connexion SMTP |
| `SMTP_PASSWORD` | (voir ci-dessous) | **Pas** ton mot de passe habituel — un mot de passe dédié |
| `MAIL_FROM` | `QuickJob <no-reply@tondomaine.com>` | L'expéditeur affiché dans l'email reçu |

## Option 1 — Gmail (le plus simple si tu as déjà un compte Gmail)

1. Va sur [myaccount.google.com/security](https://myaccount.google.com/security).
2. Active la **validation en 2 étapes** si ce n'est pas déjà fait (obligatoire
   pour l'étape suivante).
3. Cherche **"Mots de passe des applications"** (App Passwords) — tape
   "mot de passe application" dans la barre de recherche des paramètres si tu
   ne le trouves pas directement.
4. Crée un nouveau mot de passe d'application (choisis un nom, ex. "QuickJob").
   Google te donne un code de 16 caractères — **copie-le immédiatement**.
5. Renseigne :
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=ton.adresse@gmail.com
   SMTP_PASSWORD=le-code-de-16-caracteres
   MAIL_FROM=QuickJob <ton.adresse@gmail.com>
   ```

⚠️ Limite : Gmail plafonne à ~500 emails/jour sur un compte gratuit — largement
suffisant pour développer et tester, pas pour de la production à grande échelle.

## Option 2 — Brevo (anciennement Sendinblue, pensé pour l'envoi transactionnel)

1. Crée un compte gratuit sur [brevo.com](https://www.brevo.com) (300 emails/jour
   gratuits, sans limite de temps).
2. Une fois connecté : menu du compte (en haut à droite) → **"SMTP & API"**.
3. Onglet **"SMTP"** : Brevo affiche directement l'hôte, le port et ton
   identifiant SMTP (ton email Brevo).
4. Clique sur **"Générer une nouvelle clé SMTP"** (ou "Create a new SMTP key")
   — copie la clé générée, c'est ton `SMTP_PASSWORD`.
5. Renseigne :
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=ton-identifiant-affiche-par-brevo
   SMTP_PASSWORD=la-cle-smtp-generee
   MAIL_FROM=QuickJob <no-reply@tondomaine.com>
   ```

## Où coller ces variables

### En local (pour tester sur ton PC)
Dans le fichier `.env` à la racine du projet (`livrables/applications/2026-09_quickjob/.env`,
**jamais commité**), ajoute les 6 lignes ci-dessus à la suite des variables
déjà présentes.

### En production (Render)
Dashboard Render → service `quickjob-api` → **Environment** → ajoute les 6
variables une par une (mêmes clés, mêmes valeurs), puis **Save and deploy**.

## Vérifier que ça marche

1. Va sur `/forgot-password` sur le site, entre un email qui a un compte.
2. Si SMTP est configuré : l'email arrive (vérifie aussi le dossier spam la
   première fois).
3. Si SMTP n'est pas configuré : ouvre les logs du serveur (Render → Logs, ou
   le terminal en local) — le lien de réinitialisation y est affiché en clair,
   copie-le pour tester le flux quand même.
