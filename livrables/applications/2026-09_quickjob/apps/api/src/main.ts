import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Env } from '@quickjob/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Env, true>);

  app.use(helmet());
  app.enableCors({
    origin: configService.get('WEB_URL', { infer: true }),
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
