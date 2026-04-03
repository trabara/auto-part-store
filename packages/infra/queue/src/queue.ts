/**
 * Placeholder queue abstraction.
 * Replace with your BullMQ / ioredis implementation.
 */

export interface QueueOptions {
  /** Redis connection URL, e.g. redis://localhost:6379 */
  redisUrl: string;
  /** Queue name */
  name: string;
}

export interface QueueJob<T = unknown> {
  id: string;
  data: T;
  createdAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createQueue(_options: QueueOptions): void {
  throw new Error("@trabara/queue is not yet implemented");
}
