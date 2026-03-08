/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { getAuthRuntimeConfig } from './app/auth/auth.config';

async function bootstrap() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'Missing required environment variable DATABASE_URL. Copy apps/api/.env.example and set a valid PostgreSQL connection string.',
    );
  }

  const authConfig = getAuthRuntimeConfig();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: authConfig.trustedOrigins,
    credentials: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
