import type { Storage } from 'unstorage'

export interface AtomicKVOperations {
  /** Atomically returns and removes the value stored at `key`. */
  getAndDelete<T = unknown>(key: string): Promise<T | null>
  /**
   * Atomically increments `key` and returns its new value.
   * The TTL is applied only when the counter is created.
   */
  increment(key: string, ttl: number): Promise<number>
}

export function addAtomicKVOperations<T extends Storage>(
  storage: T,
  driver: unknown,
  driverName: string,
  options?: Record<string, unknown>
): T & Partial<AtomicKVOperations>
