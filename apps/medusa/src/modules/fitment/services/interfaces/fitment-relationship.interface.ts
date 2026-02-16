import { Context } from "@medusajs/framework/types";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import {
  CreateFitmentInput,
  CreateEngineInput,
  CreateModelInput,
} from "../../schema";

/**
 * Interface for managing relationships between fitment entities
 * (Makes, Models, Engines)
 *
 * Follows ISP: Clients only depend on relationship operations
 */
export interface IFitmentRelationshipService {
  /**
   * Find or create a make by name
   */
  findOrCreateMake(
    name: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  /**
   * Find or create a model by name and make ID
   */
  findOrCreateModel(
    name: string,
    makeId: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  /**
   * Find or create an engine by specs
   */
  findOrCreateEngine(
    data: CreateEngineInput,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  /**
   * Create a full fitment with related entities
   */
  createFullFitment(
    dto: CreateFitmentInput,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  /**
   * Create multiple full fitments with caching
   */
  createFullFitments(
    dtos: CreateFitmentInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  /**
   * Create model from various input formats
   */
  createModelFromInput(
    dto: CreateModelInput | any,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;
}
