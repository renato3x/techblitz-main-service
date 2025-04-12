declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    PORT: string;
    JWT_SECRET: string;
    JWT_ISSUER: string;
    RMQ_PORT: string;
    MESSAGE_BROKER_QUEUE_NAME: string;
  }
}
