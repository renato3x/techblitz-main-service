import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLoggerFactory } from './app-logger/app-logger.factory';
import { AppLoggerAdapter } from './app-logger/adapters/app-logger.adapter';

async function bootstrap(): Promise<void> {
  const AppLogger = AppLoggerFactory.getAppLogger(process.env.APP_LOGGER_PROVIDER);
  const logger = new AppLoggerAdapter(new AppLogger());
  const app = await NestFactory.create(AppModule, {
    logger,
    cors: {
      credentials: true,
      allowedHeaders: ['Content-Type'],
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    },
  });

  app.setGlobalPrefix('v1');
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
