import { DynamicModule, Global, Module } from '@nestjs/common';
import { appLoggerProviders } from './app-logger.providers';
import { APP_LOGGER_SERVICE } from './app-logger.constants';

@Global()
@Module({})
export class AppLoggerModule {
  static forRoot(options: { provider: AppLogger.AppLoggerProviderOptions }): DynamicModule {
    const appLoggerService = appLoggerProviders[options.provider];

    if (!appLoggerProviders) {
      throw new Error('App logger provider not supported');
    }

    return {
      module: AppLoggerModule,
      providers: [
        {
          provide: APP_LOGGER_SERVICE,
          useClass: appLoggerService,
        },
      ],
      exports: [APP_LOGGER_SERVICE],
    };
  }
}
