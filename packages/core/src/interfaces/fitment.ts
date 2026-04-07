import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type { Context } from "@medusajs/framework/types";
import type {
  CreateEngineInput,
  CreateFitmentInput,
  CreateMakeInput,
  CreateModelInput,
  Engine,
  Fitment,
  FitmentWithRelations,
  Make,
  Model,
  UpdateEngineInput,
  UpdateFitmentInput,
  UpdateMakeInput,
  UpdateModelInput,
} from "../dtos";
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
  readonly makes: IBaseModuleService<Make>;
  readonly models: IBaseModuleService<Model>;
  readonly engines: IBaseModuleService<Engine>;
  readonly fitments: IRestorableModuleService<Fitment>;

  // Remote Query joiner delegates
  listFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<Make[]>;
  listAndCountFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<[Make[], number]>;
  listModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<Model[]>;
  listAndCountModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<[Model[], number]>;
  listEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<Engine[]>;
  listAndCountEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<[Engine[], number]>;
  listFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<Fitment[]>;
  listAndCountFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<[Fitment[], number]>;

  // @InjectManager()-decorated CRUD delegates for controllers/workflows
  createMakes(
    data: CreateMakeInput[],
    ctx?: Context<EntityManager>,
  ): Promise<Make[]>;
  updateMakes(
    data: (UpdateMakeInput & { id: string })[],
    ctx?: Context<EntityManager>,
  ): Promise<Make[]>;
  deleteMakes(
    ids: string | string[],
    ctx?: Context<EntityManager>,
  ): Promise<void>;
  retrieveMake(
    id: string,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<Make>;

  createModels(
    data: CreateModelInput[],
    ctx?: Context<EntityManager>,
  ): Promise<Model[]>;
  updateModels(
    data: (UpdateModelInput & { id: string })[],
    ctx?: Context<EntityManager>,
  ): Promise<Model[]>;
  deleteModels(
    ids: string | string[],
    ctx?: Context<EntityManager>,
  ): Promise<void>;

  createEngines(
    data: CreateEngineInput[],
    ctx?: Context<EntityManager>,
  ): Promise<Engine[]>;
  updateEngines(
    data: (UpdateEngineInput & { id: string })[],
    ctx?: Context<EntityManager>,
  ): Promise<Engine[]>;
  deleteEngines(
    ids: string | string[],
    ctx?: Context<EntityManager>,
  ): Promise<void>;

  createFitments(
    data: CreateFitmentInput[],
    ctx?: Context<EntityManager>,
  ): Promise<Fitment[]>;
  updateFitmentsData(
    data: UpdateFitmentInput[],
    ctx?: Context<EntityManager>,
  ): Promise<Fitment[]>;
  deleteFitmentsData(
    ids: string | string[],
    ctx?: Context<EntityManager>,
  ): Promise<void>;
  retrieveFitmentById(
    id: string,
    config?: Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<Fitment>;
  restoreFitments(ids: string[], ctx?: Context<EntityManager>): Promise<void>;

  listFitmentsWithRelations(
    filters?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<FitmentWithRelations[]>;
}
