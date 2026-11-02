import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { loadEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  configureApp(app, env.CORS_ORIGIN);
  app.enableShutdownHooks();
  await app.listen(env.PORT, '0.0.0.0');
  Logger.log(`BrewLite API chạy ở cổng ${env.PORT}`, 'Bootstrap');
}

void bootstrap();
