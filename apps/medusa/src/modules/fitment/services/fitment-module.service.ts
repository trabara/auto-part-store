import { InferTypeOf, DAL, Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import * as Models from "../models";
import { CreateFitmentInput, UpdateFitmentInput } from "../schema";
import { FitmentRelationshipService } from "./fitment-relationship.service";

type FitmentMake = InferTypeOf<typeof Models.FitmentMake>;
type FitmentModel = InferTypeOf<typeof Models.FitmentModel>;
type FitmentEngine = InferTypeOf<typeof Models.FitmentEngine>;
type Fitment = InferTypeOf<typeof Models.Fitment>;

type InjectedDependencies = {
  fitmentMakeRepository: DAL.RepositoryService<FitmentMake>;
  fitmentModelRepository: DAL.RepositoryService<FitmentModel>;
  fitmentEngineRepository: DAL.RepositoryService<FitmentEngine>;
  fitmentRepository: DAL.RepositoryService<Fitment>;
};

/**
 * Main Fitment Module Service
 *
 * This service acts as a Facade that coordinates specialized services:
 * - FitmentRelationshipService: Handles entity relationships and complex creation
 * - Cascade operations: Integrated directly for delete operations
 * - MedusaService (base class): Provides basic CRUD operations
 *
 * Follows SOLID Principles:
 * - SRP: Delegates complex operations to specialized services
 * - OCP: Easy to extend with new specialized services
 * - LSP: Maintains compatibility with base MedusaService
 * - ISP: Services implement focused interfaces
 * - DIP: Depends on abstractions (service interfaces)
 */
class FitmentModuleService extends MedusaService(Models) {
  protected fitmentMakeRepository_: DAL.RepositoryService<FitmentMake>;
  protected fitmentModelRepository_: DAL.RepositoryService<FitmentModel>;
  protected fitmentEngineRepository_: DAL.RepositoryService<FitmentEngine>;
  protected fitmentRepository_: DAL.RepositoryService<Fitment>;

  // Specialized services
  protected relationshipService_: FitmentRelationshipService;

  constructor(dependencies: InjectedDependencies) {
    super(...arguments);

    this.fitmentMakeRepository_ = dependencies.fitmentMakeRepository;
    this.fitmentModelRepository_ = dependencies.fitmentModelRepository;
    this.fitmentEngineRepository_ = dependencies.fitmentEngineRepository;
    this.fitmentRepository_ = dependencies.fitmentRepository;

    // Initialize relationship service
    this.relationshipService_ = new FitmentRelationshipService(dependencies);
  }

  // ============================================================================
  // Relationship Service Methods (Delegated)
  // ============================================================================

  /**
   * Create a full fitment with all related entities
   * Delegates to FitmentRelationshipService
   */
  @InjectManager()
  public async createFullFitment(
    dto: CreateFitmentInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Fitment> {
    return await this.relationshipService_.createFullFitment(
      dto,
      sharedContext,
    );
  }

  /**
   * Create multiple full fitments with caching
   * Delegates to FitmentRelationshipService
   */
  @InjectManager()
  public async createFullFitments(
    dtos: CreateFitmentInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Fitment[]> {
    return await this.relationshipService_.createFullFitments(
      dtos,
      sharedContext,
    );
  }

  /**
   * Update a full fitment
   * Uses inherited updateFitments method from MedusaService
   */
  @InjectManager()
  public async updateFullFitment(
    data: UpdateFitmentInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Fitment> {
    const updated = await this.updateFitments([data], sharedContext);
    return updated[0];
  }

  /**
   * Create a model from various input formats
   * Delegates to FitmentRelationshipService
   */
  @InjectManager()
  public async createModelFromInput(
    dto: CreateFitmentInput | any,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<FitmentModel> {
    return await this.relationshipService_.createModelFromInput(
      dto,
      sharedContext,
    );
  }

  // ============================================================================
  // Cascade Delete Methods (Integrated from FitmentCascadeService)
  // Following SRP: Separated cascade logic from simple CRUD
  // ============================================================================

  /**
   * Delete a make and all related models and fitments
   */
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
    await this.deleteFitmentMakes([id], sharedContext);
  }

  /**
   * Delete a model and all related fitments
   */
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
      const fitmentIds = fitments.map((f) => f.id);
      await this.deleteFitments(fitmentIds, sharedContext);
    }

    // Delete the model
    await this.deleteFitmentModels([id], sharedContext);
  }

  /**
   * Delete an engine and all related fitments
   */
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
      const fitmentIds = fitments.map((f) => f.id);
      await this.deleteFitments(fitmentIds, sharedContext);
    }

    // Delete the engine
    await this.deleteFitmentEngines([id], sharedContext);
  }

  // ============================================================================
  // CRUD Methods (Inherited from MedusaService)
  // ============================================================================
  // The following methods are automatically available from MedusaService:
  // - createFitments, createFitmentMakes, createFitmentModels, createFitmentEngines
  // - updateFitments, updateFitmentMakes, updateFitmentModels, updateFitmentEngines
  // - deleteFitments, deleteFitmentMakes, deleteFitmentModels, deleteFitmentEngines
  // - listFitments, listFitmentMakes, listFitmentModels, listFitmentEngines
  // - retrieveFitment, retrieveFitmentMake, retrieveFitmentModel, retrieveFitmentEngine
  // ============================================================================
}

export default FitmentModuleService;
