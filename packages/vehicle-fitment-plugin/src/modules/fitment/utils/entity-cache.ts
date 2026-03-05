/**
 * Generic entity cache for avoiding duplicate database lookups
 * during batch operations.
 *
 * Follows SRP: Only responsible for caching entities
 */
export class EntityCache<T> {
  private cache = new Map<string, T>();

  /**
   * Get entity from cache
   */
  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  /**
   * Set entity in cache
   */
  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  /**
   * Check if entity exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get or compute entity
   * If the entity exists in cache, return it
   * Otherwise, compute it using the provided function and cache it
   */
  async getOrCompute(key: string, compute: () => Promise<T>): Promise<T> {
    if (this.has(key)) {
      return this.get(key)!;
    }

    const value = await compute();
    this.set(key, value);
    return value;
  }

  /**
   * Clear all cached entities
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}
