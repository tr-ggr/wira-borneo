/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { httpRequestLoggerMiddleware } from './common';
import { getAuthRuntimeConfig } from './config/auth.config';

async function bootstrap() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'Missing required environment variable DATABASE_URL. Copy apps/api/.env.example and set a valid PostgreSQL connection string.',
    );
  }

  const authConfig = getAuthRuntimeConfig();
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  const isDevelopment = !nodeEnv || nodeEnv === 'development';

  const app = await NestFactory.create(AppModule);

  if (isDevelopment) {
    app.use(httpRequestLoggerMiddleware);
  }

  app.enableCors({
    origin: authConfig.trustedOrigins,
    credentials: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Wira Borneo API')
    .setDescription('API documentation for local development and client generation')
    .setVersion('1.0.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, swaggerDocument, {
    jsonDocumentUrl: `${globalPrefix}/openapi.json`,
  });

  const port = process.env.PORT || 3333;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`📘 Swagger UI: http://localhost:${port}/${globalPrefix}/docs`);
  Logger.log(
    `📄 OpenAPI JSON: http://localhost:${port}/${globalPrefix}/openapi.json`,
  );
}

bootstrap();
