/**
 * Placeholder typed cache abstraction.
 * Replace with your ioredis implementation.
 */

export interface CacheOptions {
  /** Redis connection URL, e.g. redis://localhost:6379 */
  redisUrl: string;
  /** Key prefix applied to all cache keys */
  prefix?: string;
  /** Default TTL in seconds */
  defaultTtl?: number;
}

export interface CacheClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createCacheClient(_options: CacheOptions): CacheClient {
  throw new Error("@trabara/cache is not yet implemented");
}
