export interface EventEmitter {
  emit<T = any>(pattern: string, payload: T): Promise<void>;
}
