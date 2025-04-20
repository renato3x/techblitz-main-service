import { Type } from '@nestjs/common';
import { AppLogger } from './interfaces/app-logger.interface';
import { PinoAppLoggerService } from './services/pino-app-logger.service';

export const appLoggerProviders: Record<AppLogger.AppLoggerProviderOptions, Type<AppLogger>> = {
  pino: PinoAppLoggerService,
};
