import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Env } from '@quickjob/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Filet de sécurité : certaines plateformes d'hébergement peuvent altérer
 * une variable d'environnement en transit (observé sur Render : le ":" de
 * "postgresql://" disparaît, donnant "postgres//"). Corrige le schéma avant
 * que Prisma ne lise la variable. Le point d'entrée du conteneur
 * (docker-entrypoint.sh) applique déjà la même correction pour la commande
 * `prisma migrate deploy`, exécutée avant ce process Node.
 */
function normalizePostgresUrl(value: string | undefined): string | undefined {
  if (!value) {
    return value;
  }
  const match = /^postgres(ql)?\/\/(.*)$/.exec(value);
  return match ? `postgresql://${match[2]}` : value;
}

for (const key of ['DATABASE_URL', 'DIRECT_URL'] as const) {
  const normalized = normalizePostgresUrl(process.env[key]);
  if (normalized) {
    process.env[key] = normalized;
  }
}

/**
 * Origines autorisées par CORS. On accepte :
 *  - l'URL web configurée (WEB_URL, la prod) ;
 *  - toute URL de déploiement Vercel (*.vercel.app) — Vercel génère une URL de
 *    prévisualisation différente à chaque déploiement, sinon elles seraient
 *    bloquées ;
 *  - localhost (développement).
 * L'auth utilise des jetons Bearer (pas de cookie de session), donc élargir les
 * origines n'expose pas la session d'un utilisateur.
 */
function buildCorsOriginChecker(webUrl: string | undefined) {
  const explicit = new Set([webUrl].filter(Boolean) as string[]);
  const vercelHost = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
  const localhost = /^http:\/\/localhost(:\d+)?$/i;
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void => {
    if (!origin || explicit.has(origin) || vercelHost.test(origin) || localhost.test(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Env, true>);

  app.use(helmet());
  app.enableCors({
    origin: buildCorsOriginChecker(configService.get('WEB_URL', { infer: true })),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('QuickJob API')
    .setDescription('API REST de la plateforme QuickJob (auth, users, jobs).')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Render/Railway imposent leur propre port via la variable PORT (standard
  // Heroku-like buildpacks) ; API_PORT reste la valeur par défaut en local.
  const port = Number(process.env.PORT) || configService.get('API_PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
}

bootstrap();
