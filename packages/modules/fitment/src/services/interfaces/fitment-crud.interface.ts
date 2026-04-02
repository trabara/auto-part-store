import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context } from "@medusajs/framework/types";
import { UpdateFitmentInput } from "../../schema";

/**
 * Interface for basic CRUD operations on fitment entities
 *
 * Follows ISP: Clients only depend on CRUD operations
 */
export interface IFitmentCrudService {
  /**
   * Create a single fitment (basic CRUD)
   */
  createFitment(
    data: any,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  /**
   * Create multiple fitments (basic CRUD)
   */
  createFitments(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  /**
   * Update a fitment
   */
  updateFitment(
    data: UpdateFitmentInput,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  /**
   * Update multiple fitments
   */
  updateFitments(
    data: UpdateFitmentInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  /**
   * Delete a single fitment
   */
  deleteFitment(
    id: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  /**
   * Delete multiple fitments
   */
  deleteFitments(
    ids: string | string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}
