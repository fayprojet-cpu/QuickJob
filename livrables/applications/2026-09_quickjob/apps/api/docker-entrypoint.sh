#!/bin/sh
# Point d'entrée du conteneur : prépare DATABASE_URL/DIRECT_URL puis
# applique la migration avant de démarrer l'app.
#
# Constaté sur Render : la variable DATABASE_URL/DIRECT_URL (une longue
# chaîne "postgresql://user:pass@host:port/db") arrivait altérée au
# conteneur — le ":" du schéma disparaissait ("postgres//..."), de façon
# reproductible, malgré une valeur correcte saisie dans leur dashboard, un
# build sans cache, et l'absence de toute manipulation de cette variable
# dans ce repo (vérifié, et testé identique en local sans le problème).
#
# Plutôt que de continuer à deviner ce qui, côté plateforme, abîme cette
# chaîne complexe, on la reconstruit ICI à partir de morceaux simples
# (DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME) — des valeurs sans "://" ni
# "@" ni ":", beaucoup moins susceptibles d'être altérées en transit. Si ces
# variables ne sont pas fournies (dev local), on retombe sur DATABASE_URL/
# DIRECT_URL tels quels, avec une normalisation de secours au cas où le même
# type d'altération se reproduirait ailleurs.
set -e

if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
  CONSTRUCTED_URL=$(DB_HOST="$DB_HOST" DB_PORT="$DB_PORT" DB_USER="$DB_USER" \
    DB_PASSWORD="$DB_PASSWORD" DB_NAME="$DB_NAME" node -e '
      const host = process.env.DB_HOST;
      const port = process.env.DB_PORT || "5432";
      const user = encodeURIComponent(process.env.DB_USER);
      const password = encodeURIComponent(process.env.DB_PASSWORD);
      const name = process.env.DB_NAME || "postgres";
      process.stdout.write(`postgresql://${user}:${password}@${host}:${port}/${name}`);
    ')
  export DATABASE_URL="$CONSTRUCTED_URL"
  export DIRECT_URL="$CONSTRUCTED_URL"
else
  normalize_pg_url() {
    case "$1" in
      postgresql://*) printf '%s' "$1" ;;
      postgres://*) printf '%s' "$1" ;;
      postgresql//*) printf '%s' "postgresql://${1#postgresql//}" ;;
      postgres//*) printf '%s' "postgresql://${1#postgres//}" ;;
      *) printf '%s' "$1" ;;
    esac
  }

  if [ -n "$DATABASE_URL" ]; then
    export DATABASE_URL="$(normalize_pg_url "$DATABASE_URL")"
  fi
  if [ -n "$DIRECT_URL" ]; then
    export DIRECT_URL="$(normalize_pg_url "$DIRECT_URL")"
  fi
fi

npx prisma migrate deploy --schema ./prisma/schema.prisma
exec node dist/main.js
