import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type { Context } from "@medusajs/framework/types";
import type {
  UpdateFitmentInput
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
 * Full fitment module service interface combining CRUD, cascade, and relationship operations
 */
export interface IFitmentModuleService
  extends
  IFitmentCrudService {
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
}
