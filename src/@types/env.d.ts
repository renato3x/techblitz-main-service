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
    AUTH_TOKEN_COOKIE_NAME: string;
    STORAGE_AUTH_TOKEN_COOKIE_NAME: string;
    ACCOUNT_RECOVERY_TOKEN_TTL_IN_MINUTES: string;
    ACCOUNT_DELETION_CODE_TTL_IN_MINUTES: string;
  }
}
