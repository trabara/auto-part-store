import { InferTypeOf, DAL, Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import * as Models from "../models";
import { IFitmentCascadeService } from "./interfaces/fitment-cascade.interface";

type FitmentMake = InferTypeOf<typeof Models.FitmentMake>;
type FitmentModel = InferTypeOf<typeof Models.FitmentModel>;
type FitmentEngine = InferTypeOf<typeof Models.FitmentEngine>;
type Fitment = InferTypeOf<typeof Models.Fitment>;

type InjectedDependencies = {
  fitmentMakeRepository: DAL.RepositoryService<FitmentMake>;
  fitmentModelRepository: DAL.RepositoryService<FitmentModel>;
  fitmentEngineRepository: DAL.RepositoryService<FitmentEngine>;
  fitmentRepository: DAL.RepositoryService<Fitment>;
  deleteFitmentMakes?: (
    ids: string[],
    context?: Context<EntityManager>,
  ) => Promise<void>;
  deleteFitmentModels?: (
    ids: string[],
    context?: Context<EntityManager>,
  ) => Promise<void>;
  deleteFitmentEngines?: (
    ids: string[],
    context?: Context<EntityManager>,
  ) => Promise<void>;
  deleteFitments?: (
    ids: string[],
    context?: Context<EntityManager>,
  ) => Promise<void>;
};

/**
 * Service responsible for cascade delete operations on fitment entities
 *
 * Responsibilities (SRP):
 * - Delete entities with their dependent relationships
 * - Ensure data integrity during cascade operations
 * - Handle transactional cascade deletes
 */
export class FitmentCascadeService implements IFitmentCascadeService {
  protected fitmentMakeRepository_: DAL.RepositoryService<FitmentMake>;
  protected fitmentModelRepository_: DAL.RepositoryService<FitmentModel>;
  protected fitmentEngineRepository_: DAL.RepositoryService<FitmentEngine>;
  protected fitmentRepository_: DAL.RepositoryService<Fitment>;
  protected deleteFitmentMakes_: (
    ids: string[],
    context?: Context<EntityManager>,
  ) => Promise<void>;
  protected deleteFitmentModels_: (
    ids: string[],
    context?: Context<EntityManager>,
  ) => Promise<void>;
  protected deleteFitmentEngines_: (
    ids: string[],
    context?: Context<EntityManager>,
  ) => Promise<void>;
  protected deleteFitments_: (
    ids: string[],
    context?: Context<EntityManager>,
  ) => Promise<void>;

  constructor(dependencies: InjectedDependencies) {
    this.fitmentMakeRepository_ = dependencies.fitmentMakeRepository;
    this.fitmentModelRepository_ = dependencies.fitmentModelRepository;
    this.fitmentEngineRepository_ = dependencies.fitmentEngineRepository;
    this.fitmentRepository_ = dependencies.fitmentRepository;

    // Use provided delete functions or fallback to repository delete
    this.deleteFitmentMakes_ =
      dependencies.deleteFitmentMakes ||
      (async (ids, ctx) => { await this.fitmentMakeRepository_.delete({ id: { $in: ids } }, ctx); });
    this.deleteFitmentModels_ =
      dependencies.deleteFitmentModels ||
      (async (ids, ctx) => { await this.fitmentModelRepository_.delete({ id: { $in: ids } }, ctx); });
    this.deleteFitmentEngines_ =
      dependencies.deleteFitmentEngines ||
      (async (ids, ctx) => { await this.fitmentEngineRepository_.delete({ id: { $in: ids } }, ctx); });
    this.deleteFitments_ =
      dependencies.deleteFitments ||
      (async (ids, ctx) => { await this.fitmentRepository_.delete({ id: { $in: ids } }, ctx); });
  }

  @InjectManager()
  public async deleteMakeWithCascade(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    return await this.deleteMakeWithCascade_(id, sharedContext);
  }

  @InjectTransactionManager()
  protected async deleteMakeWithCascade_(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    // Find all models for this make
    const models = await this.fitmentModelRepository_.find(
      { where: { make_id: id } },
      sharedContext,
    );

    // For each model, delete all fitments
    for (const model of models) {
      await this.deleteModelWithCascade_(model.id, sharedContext);
    }

    // Delete the make
    await this.deleteFitmentMakes_([id], sharedContext);
  }

  @InjectManager()
  public async deleteModelWithCascade(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    return await this.deleteModelWithCascade_(id, sharedContext);
  }

  @InjectTransactionManager()
  protected async deleteModelWithCascade_(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    // Find all fitments for this model
    const fitments = await this.fitmentRepository_.find(
      { where: { model_id: id } },
      sharedContext,
    );

    // Delete all fitments
    if (fitments.length > 0) {
      await this.deleteFitments_(
        fitments.map((f) => f.id),
        sharedContext,
      );
    }

    // Delete the model
    await this.deleteFitmentModels_([id], sharedContext);
  }

  @InjectManager()
  public async deleteEngineWithCascade(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    return await this.deleteEngineWithCascade_(id, sharedContext);
  }

  @InjectTransactionManager()
  protected async deleteEngineWithCascade_(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    // Find all fitments for this engine
    const fitments = await this.fitmentRepository_.find(
      { where: { engine_id: id } },
      sharedContext,
    );

    // Delete all fitments
    if (fitments.length > 0) {
      await this.deleteFitments_(
        fitments.map((f) => f.id),
        sharedContext,
      );
    }

    // Delete the engine
    await this.deleteFitmentEngines_([id], sharedContext);
  }
}
