import { Context } from "@medusajs/framework/types";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";

/**
 * Interface for cascade delete operations on fitment entities
 *
 * Follows ISP: Clients only depend on cascade delete operations
 */
export interface IFitmentCascadeService {
  /**
   * Delete a make and all its related models and fitments
   */
  deleteMakeWithCascade(
    id: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  /**
   * Delete a model and all its related fitments
   */
  deleteModelWithCascade(
    id: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  /**
   * Delete an engine and all its related fitments
   */
  deleteEngineWithCascade(
    id: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}
