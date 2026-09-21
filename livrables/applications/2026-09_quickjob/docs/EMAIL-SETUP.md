# Configurer l'envoi d'email (mot de passe oublié)

QuickJob envoie un vrai email quand quelqu'un clique sur "mot de passe
oublié". **Sans réglages, l'API fonctionne quand même** : le lien de
réinitialisation est juste affiché dans les logs du serveur au lieu d'être
envoyé par email (pratique pour développer en local sans rien configurer).

⚠️ **En production (Render) : utilise `BREVO_API_KEY` (Option A ci-dessous),
pas `SMTP_*` seul.** Render bloque les connexions SMTP sortantes (port 587) :
un envoi par SMTP y reste bloqué ~2 minutes avant d'échouer silencieusement,
ce qui fait planter la page côté site. L'API HTTP de Brevo (port 443, comme
n'importe quel site web) n'est jamais bloquée.

## Option A — API Brevo (recommandé, obligatoire sur Render)

1. Crée un compte gratuit sur [brevo.com](https://www.brevo.com) (300 emails/jour
   gratuits, sans limite de temps). Un compte Brevo existant pour un autre
   projet peut être réutilisé.
2. Vérifie une adresse expéditeur : menu du compte (en haut à droite) →
   **"Expéditeurs, domaine, IP"** → **"Ajouter un expéditeur"** → renseigne un
   nom et une adresse email → confirme via le lien reçu par email sur cette
   adresse.
3. Récupère la clé API : menu du compte → **"SMTP et API"** → onglet
   **"Clés API et MCP"** → **"Générer une nouvelle clé API"** → copie la clé
   (elle commence par `xkeysib-...`).
4. Renseigne :
   ```
   BREVO_API_KEY=xkeysib-la-cle-generee
   MAIL_FROM=QuickJob <adresse-verifiee@exemple.com>
   ```
   (les variables `SMTP_*` peuvent rester vides — elles ne sont utilisées que
   si `BREVO_API_KEY` est absent.)

## Option B — SMTP générique (dev local uniquement)

Utile en local si tu préfères un vrai envoi SMTP (Gmail, Brevo SMTP, etc.)
plutôt que le mode "console". **Ne fonctionne pas sur Render** (voir
ci-dessus) — n'utilise pas cette option seule en production.

| Variable | Exemple | C'est quoi |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | L'adresse du serveur d'envoi |
| `SMTP_PORT` | `587` | Le port (587 dans presque tous les cas) |
| `SMTP_SECURE` | `false` | `true` seulement si tu utilises le port 465 |
| `SMTP_USER` | ton adresse email | Identifiant de connexion SMTP |
| `SMTP_PASSWORD` | (voir ci-dessous) | **Pas** ton mot de passe habituel — un mot de passe dédié |
| `MAIL_FROM` | `QuickJob <no-reply@tondomaine.com>` | L'expéditeur affiché dans l'email reçu |

### Gmail

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

⚠️ Limite : Gmail plafonne à ~500 emails/jour sur un compte gratuit.

### Brevo (SMTP)

1. Menu du compte Brevo → **"SMTP et API"** → onglet **"SMTP"** : hôte, port
   et identifiant SMTP affichés directement.
2. **"Générer une nouvelle clé SMTP"** — copie la clé générée, c'est ton
   `SMTP_PASSWORD`.
3. Renseigne :
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
**jamais commité**), ajoute les lignes ci-dessus à la suite des variables
déjà présentes.

### En production (Render)
Dashboard Render → service `quickjob-api` → **Environment** → ajoute les
variables une par une (mêmes clés, mêmes valeurs), puis **Save and deploy**.

## Vérifier que ça marche

1. Va sur `/forgot-password` sur le site, entre un email qui a un compte.
2. Si l'envoi est configuré : l'email arrive (vérifie aussi le dossier spam la
   première fois).
3. Si rien n'est configuré : ouvre les logs du serveur (Render → Logs, ou
   le terminal en local) — le lien de réinitialisation y est affiché en clair,
   copie-le pour tester le flux quand même.
