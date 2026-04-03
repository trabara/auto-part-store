import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type {
  CreateEngineInput,
  CreateModelInput,
  UpdateFitmentInput,
} from "../dtos/fitment";

/**
 * Interface for basic CRUD operations on fitment entities
 *
 * Follows ISP: Clients only depend on CRUD operations
 */
export interface IFitmentCrudService {
  createFitment(
    data: any,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createFitments(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  updateFitment(
    data: UpdateFitmentInput,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  updateFitments(
    data: UpdateFitmentInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteFitment(
    id: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  deleteFitments(
    ids: string | string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}

/**
 * Interface for cascade delete operations on fitment entities
 *
 * Follows ISP: Clients only depend on cascade delete operations
 */
export interface IFitmentCascadeService {
  deleteMakeWithCascade(
    id: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  deleteModelWithCascade(
    id: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  deleteEngineWithCascade(
    id: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}

/**
 * Interface for managing relationships between fitment entities
 * (Makes, Models, Engines)
 *
 * Follows ISP: Clients only depend on relationship operations
 */
export interface IFitmentRelationshipService {
  findOrCreateMake(
    name: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  findOrCreateModel(
    name: string,
    makeId: string,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  findOrCreateEngine(
    data: CreateEngineInput,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createModelFromInput(
    dto: CreateModelInput | any,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;
}
