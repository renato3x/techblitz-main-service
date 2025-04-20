declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    PORT: string;
    JWT_SECRET: string;
    JWT_ISSUER: string;
    BROKER_URL: string;
    QUEUE_NAME: string;
    RETRY_QUEUE_NAME: string;
    DEAD_LETTER_QUEUE_NAME: string;
    RETRY_TIMEOUT: string;
  }
}
