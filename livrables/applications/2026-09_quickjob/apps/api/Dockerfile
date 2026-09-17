# syntax=docker/dockerfile:1
# Build context attendu : la racine du projet quickjob
# (livrables/applications/2026-09_quickjob), pas apps/api — le monorepo
# pnpm a besoin de voir pnpm-workspace.yaml, packages/config et prisma/.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @quickjob/config build
RUN pnpm --filter @quickjob/api exec prisma generate --schema ../../prisma/schema.prisma
RUN pnpm --filter @quickjob/api build
# `pnpm deploy` produit un node_modules autonome (résolu, sans symlinks vers
# le store pnpm) pour @quickjob/api et ses dépendances — seule approche
# fiable pour sortir un package d'un monorepo pnpm vers une image Docker.
RUN pnpm --filter @quickjob/api deploy --prod /app/deploy

FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S quickjob && adduser -S quickjob -G quickjob
COPY --from=build /app/deploy /app
COPY --from=build /app/prisma /app/prisma
COPY apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh
# Régénère le client Prisma une fois la mise en page finale de l'image en
# place : le client généré pendant `pnpm deploy` (étape build) référence des
# chemins internes qui ne correspondent plus après la copie inter-stage,
# ce qui produisait des enums undefined (`UserRole.WORKER` etc.) au démarrage.
RUN npx prisma generate --schema ./prisma/schema.prisma
RUN chmod +x /app/docker-entrypoint.sh && chown -R quickjob:quickjob /app
USER quickjob

EXPOSE 4000
CMD ["/app/docker-entrypoint.sh"]
