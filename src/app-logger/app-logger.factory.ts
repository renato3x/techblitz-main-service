import { appLoggerProviders } from './app-logger.providers';

export class AppLoggerFactory {
  static getAppLogger(provider: AppLogger.AppLoggerProviderOptions) {
    const appLoggerService = appLoggerProviders[provider];

    if (!appLoggerProviders) {
      throw new Error('App logger provider not supported');
    }

    return appLoggerService;
  }
}
