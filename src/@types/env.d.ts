declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    PORT: string;
    JWT_SECRET: string;
    JWT_ISSUER: string;
    BROKER_URL: string;
    QUEUE_NAME: string;
    APP_LOGGER_PROVIDER: AppLogger.AppLoggerProviderOptions;
    EVENT_EMITTER_PROVIDER: EventEmitter.EventEmitterProviderOptions;
    NODE_ENV: string;
    CLIENT_URL: string;
  }
}
