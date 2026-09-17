#!/bin/sh
# Point d'entrée du conteneur : normalise DATABASE_URL/DIRECT_URL puis
# applique la migration avant de démarrer l'app.
#
# Filet de sécurité : certaines plateformes d'hébergement altèrent parfois
# la valeur d'une variable d'environnement en transit (observé sur Render :
# "postgresql://" devient "postgres//", le ":" disparaît). Ni ce script ni
# le reste du code n'introduit cette altération — elle a été confirmée
# absente en local avec la même image et la même URL. On la corrige quand
# même ici défensivement, avant que quoi que ce soit ne lise la variable.
set -e

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

npx prisma migrate deploy --schema ./prisma/schema.prisma
exec node dist/main.js
