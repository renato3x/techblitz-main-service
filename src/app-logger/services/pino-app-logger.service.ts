import { Injectable } from '@nestjs/common';
import { AppLogger } from '../interfaces/app-logger.interface';
import { PrettyOptions } from 'pino-pretty';
import pino, { Logger, LoggerOptions } from 'pino';

@Injectable()
export class PinoAppLoggerService implements AppLogger {
  private readonly logger: Logger;
  private readonly options: Record<string, LoggerOptions> = {
    development: {
      transport: {
        targets: [
          {
            target: 'pino-pretty',
            level: 'debug',
            options: {
              colorize: true,
              hideObject: true,
            } as PrettyOptions,
          },
          {
            target: 'pino/file',
            level: 'debug',
            options: {
              destination: 'app.log',
            },
          },
        ],
      },
    },
    production: {
      transport: {
        targets: [
          {
            target: 'pino-pretty',
            level: 'info',
            options: {
              colorize: true,
              hideObject: true,
            } as PrettyOptions,
          },
          {
            target: 'pino/file',
            level: 'info',
            options: {
              destination: 'app.log',
            },
          },
        ],
      },
    },
  };

  constructor() {
    this.logger = pino(this.options[process.env.NODE_ENV]);
  }

  info(message: string, meta: AppLogger.LogMetadata): void {
    this.logger.info(meta, message);
  }

  error(message: string, meta: AppLogger.LogMetadata): void {
    this.logger.error(meta, message);
  }

  warn(message: string, meta: AppLogger.LogMetadata): void {
    this.logger.warn(meta, message);
  }
}
