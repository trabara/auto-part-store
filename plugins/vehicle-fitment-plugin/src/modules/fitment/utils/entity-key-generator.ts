import { CreateEngineInput } from "../schema";

/**
 * Generates unique cache keys for fitment entities
 *
 * Follows SRP: Only responsible for key generation logic
 */
export class EntityKeyGenerator {
  /**
   * Generate unique key for engine entity
   * Combines fuel, type, size, and optional tech specs
   */
  static generateEngineKey(engine: CreateEngineInput): string {
    return `${engine.fuel}:${engine.type}:${engine.size}:${engine.tech || ""}`;
  }

  /**
   * Generate unique key for model entity
   * Combines make ID and model name
   */
  static generateModelKey(makeId: string, modelName: string): string {
    return `${makeId}:${modelName}`;
  }

  /**
   * Generate unique key for make entity
   * Uses the make name as the key
   */
  static generateMakeKey(name: string): string {
    return name;
  }
}
