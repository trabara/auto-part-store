import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type {
  CreateEngineInput,
  CreateFitmentInput,
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

/**
 * Full fitment module service interface combining CRUD, cascade, and relationship operations
 */
export interface IFitmentModuleService
  extends
    IFitmentCrudService,
    IFitmentCascadeService,
    IFitmentRelationshipService {
  // Makes
  listFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  retrieveFitmentMake(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createFitmentMakes(
    data: any | any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  updateFitmentMakes(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteFitmentMakes(
    ids: string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  // Models
  listFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  retrieveFitmentModel(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createFitmentModels(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  updateFitmentModels(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteFitmentModels(
    ids: string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  // Engines
  listFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  retrieveFitmentEngine(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createFitmentEngines(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  updateFitmentEngines(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteFitmentEngines(
    ids: string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  // Fitments
  listFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  retrieveFitment(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  restoreFitments(
    ids: string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  // Complex operations
  updateFullFitment(
    data: UpdateFitmentInput,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createFullFitments(
    dtos: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  createFullFitment(
    dto: any,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;
}
