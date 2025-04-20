export interface AppLogger {
  info(message: string, meta: AppLogger.LogMetadata): void;
  error(message: string, meta: AppLogger.LogMetadata): void;
  warn(message: string, meta: AppLogger.LogMetadata): void;
}
