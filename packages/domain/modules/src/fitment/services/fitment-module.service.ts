import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context, DAL, InferTypeOf } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import { UpdateFitmentInput } from "@trabara/core/dtos";
import type { IFitmentModuleService } from "@trabara/core/interfaces";
import * as Models from "../models";

type InjectedDependencies = {
  fitmentMakeRepository: DAL.RepositoryService<Models.FitmentMake>;
  fitmentModelRepository: DAL.RepositoryService<Models.FitmentModel>;
  fitmentEngineRepository: DAL.RepositoryService<Models.FitmentEngine>;
  fitmentRepository: DAL.RepositoryService<Models.Fitment>;
  baseRepository: DAL.RepositoryService<any>;
};

class FitmentModuleService implements IFitmentModuleService {
  protected fitmentMakeRepository_: DAL.RepositoryService<Models.FitmentMake>;
  protected fitmentModelRepository_: DAL.RepositoryService<Models.FitmentModel>;
  protected fitmentEngineRepository_: DAL.RepositoryService<Models.FitmentEngine>;
  protected fitmentRepository_: DAL.RepositoryService<Models.Fitment>;
  protected baseRepository_: DAL.RepositoryService<any>;

  constructor(dependencies: InjectedDependencies) {
    this.fitmentMakeRepository_ = dependencies.fitmentMakeRepository;
    this.fitmentModelRepository_ = dependencies.fitmentModelRepository;
    this.fitmentEngineRepository_ = dependencies.fitmentEngineRepository;
    this.fitmentRepository_ = dependencies.fitmentRepository;
    this.baseRepository_ = dependencies.baseRepository;
  }

  // ============================================================================
  // FitmentMake CRUD
  // ============================================================================

  @InjectManager()
  async listFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake[]> {
    return this.listFitmentMakes_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listFitmentMakes_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake[]> {
    return this.fitmentMakeRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.FitmentMake[], number]> {
    return this.listAndCountFitmentMakes_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountFitmentMakes_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.FitmentMake[], number]> {
    return this.fitmentMakeRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async retrieveFitmentMake(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake> {
    return this.retrieveFitmentMake_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveFitmentMake_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake> {
    const [make] = await this.fitmentMakeRepository_.find(
      { where: { id } },
      ctx,
    );
    if (!make) throw new Error(`FitmentMake with id ${id} not found`);
    return make;
  }

  @InjectManager()
  async createFitmentMakes(
    data: any | any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake | Models.FitmentMake[]> {
    return this.createFitmentMakes_(data, ctx);
  }

  @InjectTransactionManager()
  private async createFitmentMakes_(
    data: any | any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake | Models.FitmentMake[]> {
    const arr = Array.isArray(data) ? data : [data];
    const result = await this.fitmentMakeRepository_.create(arr, ctx);
    return Array.isArray(data) ? result : result[0];
  }

  @InjectManager()
  async updateFitmentMakes(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake[]> {
    return this.updateFitmentMakes_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitmentMakes_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.fitmentMakeRepository_.find(
      { where: { id: { $in: ids } } },
      ctx,
    );
    const updateMap = new Map(data.map((d) => [d.id, d]));
    const pairs = entities.map((entity) => ({
      entity,
      update: updateMap.get(entity.id),
    }));
    return this.fitmentMakeRepository_.update(pairs, ctx);
  }

  @InjectManager()
  async deleteFitmentMakes(
    ids: string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteFitmentMakes_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteFitmentMakes_(
    ids: string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.fitmentMakeRepository_.delete({ id: { $in: ids } }, ctx);
  }

  // ============================================================================
  // FitmentModel CRUD
  // ============================================================================

  @InjectManager()
  async listFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel[]> {
    return this.listFitmentModels_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listFitmentModels_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel[]> {
    return this.fitmentModelRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.FitmentModel[], number]> {
    return this.listAndCountFitmentModels_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountFitmentModels_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.FitmentModel[], number]> {
    return this.fitmentModelRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async retrieveFitmentModel(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel> {
    return this.retrieveFitmentModel_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveFitmentModel_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel> {
    const [model] = await this.fitmentModelRepository_.find(
      { where: { id } },
      ctx,
    );
    if (!model) throw new Error(`FitmentModel with id ${id} not found`);
    return model;
  }

  @InjectManager()
  async createFitmentModels(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel[]> {
    return this.createFitmentModels_(data, ctx);
  }

  @InjectTransactionManager()
  private async createFitmentModels_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel[]> {
    return this.fitmentModelRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateFitmentModels(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel[]> {
    return this.updateFitmentModels_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitmentModels_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.fitmentModelRepository_.find(
      { where: { id: { $in: ids } } },
      ctx,
    );
    const updateMap = new Map(data.map((d) => [d.id, d]));
    const pairs = entities.map((entity) => ({
      entity,
      update: updateMap.get(entity.id),
    }));
    return this.fitmentModelRepository_.update(pairs, ctx);
  }

  @InjectManager()
  async deleteFitmentModels(
    ids: string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteFitmentModels_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteFitmentModels_(
    ids: string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.fitmentModelRepository_.delete({ id: { $in: ids } }, ctx);
  }

  // ============================================================================
  // FitmentEngine CRUD
  // ============================================================================

  @InjectManager()
  async listFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    return this.listFitmentEngines_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listFitmentEngines_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    return this.fitmentEngineRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.FitmentEngine[], number]> {
    return this.listAndCountFitmentEngines_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountFitmentEngines_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.FitmentEngine[], number]> {
    return this.fitmentEngineRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async retrieveFitmentEngine(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine> {
    return this.retrieveFitmentEngine_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveFitmentEngine_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine> {
    const [engine] = await this.fitmentEngineRepository_.find(
      { where: { id } },
      ctx,
    );
    if (!engine) throw new Error(`FitmentEngine with id ${id} not found`);
    return engine;
  }

  @InjectManager()
  async createFitmentEngines(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    return this.createFitmentEngines_(data, ctx);
  }

  @InjectTransactionManager()
  private async createFitmentEngines_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    return this.fitmentEngineRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateFitmentEngines(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    return this.updateFitmentEngines_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitmentEngines_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.fitmentEngineRepository_.find(
      { where: { id: { $in: ids } } },
      ctx,
    );
    const updateMap = new Map(data.map((d) => [d.id, d]));
    const pairs = entities.map((entity) => ({
      entity,
      update: updateMap.get(entity.id),
    }));
    return this.fitmentEngineRepository_.update(pairs, ctx);
  }

  @InjectManager()
  async deleteFitmentEngines(
    ids: string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteFitmentEngines_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteFitmentEngines_(
    ids: string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.fitmentEngineRepository_.delete({ id: { $in: ids } }, ctx);
  }

  // ============================================================================
  // Fitment CRUD
  // ============================================================================

  @InjectManager()
  async listFitmentsWithRelations(
    filters?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<any[]> {
    return this.listFitmentsWithRelations_(filters, ctx);
  }

  @InjectTransactionManager()
  private async listFitmentsWithRelations_(
    filters?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<any[]> {
    const fitments = await this.fitmentRepository_.find(
      { where: filters ?? {} },
      ctx,
    );
    if (!fitments.length) return [];

    // Load models and engines
    const modelIds = [
      ...new Set(fitments.map((f: any) => f.model_id).filter(Boolean)),
    ];
    const engineIds = [
      ...new Set(fitments.map((f: any) => f.engine_id).filter(Boolean)),
    ];

    const [models, engines] = await Promise.all([
      modelIds.length
        ? this.fitmentModelRepository_.find(
            { where: { id: { $in: modelIds } } },
            ctx,
          )
        : [],
      engineIds.length
        ? this.fitmentEngineRepository_.find(
            { where: { id: { $in: engineIds } } },
            ctx,
          )
        : [],
    ]);

    // Load makes for models
    const makeIds = [
      ...new Set((models as any[]).map((m: any) => m.make_id).filter(Boolean)),
    ];
    const makes = makeIds.length
      ? await this.fitmentMakeRepository_.find(
          { where: { id: { $in: makeIds } } },
          ctx,
        )
      : [];

    const modelMap = new Map((models as any[]).map((m: any) => [m.id, m]));
    const engineMap = new Map((engines as any[]).map((e: any) => [e.id, e]));
    const makeMap = new Map((makes as any[]).map((mk: any) => [mk.id, mk]));

    return fitments.map((f: any) => {
      const model = modelMap.get(f.model_id);
      const engine = engineMap.get(f.engine_id);
      return {
        ...f,
        model: model
          ? { ...model, make: makeMap.get(model.make_id) ?? null }
          : null,
        engine: engine ?? null,
      };
    });
  }

  @InjectManager()
  async listFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.listFitments_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listFitments_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.fitmentRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.Fitment[], number]> {
    return this.listAndCountFitments_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountFitments_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.Fitment[], number]> {
    return this.fitmentRepository_.findAndCount({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async retrieveFitment(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment> {
    return this.retrieveFitment_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveFitment_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment> {
    const [fitment] = await this.fitmentRepository_.find(
      { where: { id } },
      ctx,
    );
    if (!fitment) throw new Error(`Fitment with id ${id} not found`);
    return fitment;
  }

  // IFitmentCrudService compat aliases
  @InjectManager()
  async createFitment(
    data: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment> {
    const [result] = await this.createFitments_([data], ctx);
    return result;
  }

  @InjectManager()
  async createFitments(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.createFitments_(data, ctx);
  }

  @InjectTransactionManager()
  private async createFitments_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.fitmentRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateFitment(
    data: UpdateFitmentInput,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment> {
    const [result] = await this.updateFitments_([data], ctx);
    return result;
  }

  @InjectManager()
  async updateFitments(
    data: UpdateFitmentInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.updateFitments_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitments_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.fitmentRepository_.find(
      { where: { id: { $in: ids } } },
      ctx,
    );
    const updateMap = new Map(data.map((d) => [d.id, d]));
    const pairs = entities.map((entity) => ({
      entity,
      update: updateMap.get(entity.id),
    }));
    return this.fitmentRepository_.update(pairs, ctx);
  }

  @InjectManager()
  async deleteFitment(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteFitments_([id], ctx);
  }

  @InjectManager()
  async deleteFitments(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    return this.deleteFitments_(arr, ctx);
  }

  @InjectTransactionManager()
  private async deleteFitments_(
    ids: string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.fitmentRepository_.delete({ id: { $in: ids } }, ctx);
  }

  @InjectManager()
  async restoreFitments(
    ids: string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.restoreFitments_(ids, ctx);
  }

  @InjectTransactionManager()
  private async restoreFitments_(
    ids: string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.fitmentRepository_.restore({ id: { $in: ids } }, ctx);
  }
}

export default FitmentModuleService;
