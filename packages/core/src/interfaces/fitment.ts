import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type { Context } from "@medusajs/framework/types";
import type {
  IBaseModuleService,
  IRestorableModuleService,
} from "./base-module-service";

/**
 * Full fitment module service interface using namespace accessor pattern.
 *
 * Namespace accessors (sub-services) are kept for in-DI-context callers and
 * testing. For controllers / workflow steps (no ctx of their own), use the
 * @InjectManager()-decorated delegate methods below.
 */
export interface IFitmentModuleService {
  readonly makes: IBaseModuleService<any>;
  readonly models: IBaseModuleService<any>;
  readonly engines: IBaseModuleService<any>;
  readonly fitments: IRestorableModuleService<any>;

  // Remote Query joiner delegates
  listFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<any[]>;
  listAndCountFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<[any[], number]>;
  listFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<any[]>;
  listAndCountFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<[any[], number]>;
  listFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<any[]>;
  listAndCountFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<[any[], number]>;
  listFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<any[]>;
  listAndCountFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<[any[], number]>;

  // @InjectManager()-decorated CRUD delegates for controllers/workflows
  createMakes(data: any[], ctx?: Context<EntityManager>): Promise<any[]>;
  updateMakes(data: any[], ctx?: Context<EntityManager>): Promise<any[]>;
  deleteMakes(
    ids: string | string[],
    ctx?: Context<EntityManager>,
  ): Promise<void>;
  retrieveMake(
    id: string,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<any>;

  createFitmentModels(
    data: any[],
    ctx?: Context<EntityManager>,
  ): Promise<any[]>;
  updateFitmentModels(
    data: any[],
    ctx?: Context<EntityManager>,
  ): Promise<any[]>;
  deleteFitmentModels(
    ids: string | string[],
    ctx?: Context<EntityManager>,
  ): Promise<void>;

  createEngines(data: any[], ctx?: Context<EntityManager>): Promise<any[]>;
  updateEngines(data: any[], ctx?: Context<EntityManager>): Promise<any[]>;
  deleteEngines(
    ids: string | string[],
    ctx?: Context<EntityManager>,
  ): Promise<void>;

  createFitments(data: any[], ctx?: Context<EntityManager>): Promise<any[]>;
  updateFitmentsData(data: any[], ctx?: Context<EntityManager>): Promise<any[]>;
  deleteFitmentsData(
    ids: string | string[],
    ctx?: Context<EntityManager>,
  ): Promise<void>;
  retrieveFitmentById(
    id: string,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<any>;
  restoreFitments(ids: string[], ctx?: Context<EntityManager>): Promise<void>;

  listFitmentsWithRelations(
    filters?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;
}
