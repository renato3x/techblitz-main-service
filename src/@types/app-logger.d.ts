declare namespace AppLogger {
  type AppLoggerProviderOptions = 'pino';
  type LogMetadata = {
    context: string;
    meta?: {
      [key: string]: any;
    };
  };
}
