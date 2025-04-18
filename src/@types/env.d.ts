declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    PORT: string;
    JWT_SECRET: string;
    JWT_ISSUER: string;
    BROKER_URL: string;
    QUEUE_NAME: string;
  }
}
