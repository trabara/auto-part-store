import { Context, DAL, InferTypeOf } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import * as Models from "../models";
import {
  CreateEngineInput,
  CreateModelInput,
  UpdateFitmentInput,
} from "@trabara/core/dtos";
import type { IFitmentModuleService } from "@trabara/core/interfaces";

type FitmentMake = InferTypeOf<typeof Models.FitmentMake>;
type FitmentModel = InferTypeOf<typeof Models.FitmentModel>;
type FitmentEngine = InferTypeOf<typeof Models.FitmentEngine>;
type Fitment = InferTypeOf<typeof Models.Fitment>;

type InjectedDependencies = {
  fitmentMakeRepository: DAL.RepositoryService<FitmentMake>;
  fitmentModelRepository: DAL.RepositoryService<FitmentModel>;
  fitmentEngineRepository: DAL.RepositoryService<FitmentEngine>;
  fitmentRepository: DAL.RepositoryService<Fitment>;
  baseRepository: DAL.RepositoryService<any>;
};

class FitmentModuleService implements IFitmentModuleService {
  protected fitmentMakeRepository_: DAL.RepositoryService<FitmentMake>;
  protected fitmentModelRepository_: DAL.RepositoryService<FitmentModel>;
  protected fitmentEngineRepository_: DAL.RepositoryService<FitmentEngine>;
  protected fitmentRepository_: DAL.RepositoryService<Fitment>;
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
  ): Promise<FitmentMake[]> {
    return this.listFitmentMakes_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listFitmentMakes_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentMake[]> {
    return this.fitmentMakeRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[FitmentMake[], number]> {
    return this.listAndCountFitmentMakes_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountFitmentMakes_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[FitmentMake[], number]> {
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
  ): Promise<FitmentMake> {
    return this.retrieveFitmentMake_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveFitmentMake_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentMake> {
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
  ): Promise<any> {
    return this.createFitmentMakes_(data, ctx);
  }

  @InjectTransactionManager()
  private async createFitmentMakes_(
    data: any | any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<any> {
    const arr = Array.isArray(data) ? data : [data];
    const result = await this.fitmentMakeRepository_.create(arr, ctx);
    return Array.isArray(data) ? result : result[0];
  }

  @InjectManager()
  async updateFitmentMakes(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentMake[]> {
    return this.updateFitmentMakes_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitmentMakes_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentMake[]> {
    return this.fitmentMakeRepository_.update(data, ctx);
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
  ): Promise<FitmentModel[]> {
    return this.listFitmentModels_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listFitmentModels_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentModel[]> {
    return this.fitmentModelRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[FitmentModel[], number]> {
    return this.listAndCountFitmentModels_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountFitmentModels_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[FitmentModel[], number]> {
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
  ): Promise<FitmentModel> {
    return this.retrieveFitmentModel_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveFitmentModel_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentModel> {
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
  ): Promise<FitmentModel[]> {
    return this.createFitmentModels_(data, ctx);
  }

  @InjectTransactionManager()
  private async createFitmentModels_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentModel[]> {
    return this.fitmentModelRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateFitmentModels(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentModel[]> {
    return this.updateFitmentModels_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitmentModels_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentModel[]> {
    return this.fitmentModelRepository_.update(data, ctx);
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
  ): Promise<FitmentEngine[]> {
    return this.listFitmentEngines_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listFitmentEngines_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentEngine[]> {
    return this.fitmentEngineRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[FitmentEngine[], number]> {
    return this.listAndCountFitmentEngines_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountFitmentEngines_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[FitmentEngine[], number]> {
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
  ): Promise<FitmentEngine> {
    return this.retrieveFitmentEngine_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveFitmentEngine_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentEngine> {
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
  ): Promise<FitmentEngine[]> {
    return this.createFitmentEngines_(data, ctx);
  }

  @InjectTransactionManager()
  private async createFitmentEngines_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentEngine[]> {
    return this.fitmentEngineRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateFitmentEngines(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentEngine[]> {
    return this.updateFitmentEngines_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitmentEngines_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentEngine[]> {
    return this.fitmentEngineRepository_.update(data, ctx);
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
  async listFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment[]> {
    return this.listFitments_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listFitments_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment[]> {
    return this.fitmentRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Fitment[], number]> {
    return this.listAndCountFitments_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountFitments_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Fitment[], number]> {
    return this.fitmentRepository_.findAndCount({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async retrieveFitment(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment> {
    return this.retrieveFitment_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveFitment_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment> {
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
  ): Promise<Fitment> {
    const [result] = await this.createFitments_([data], ctx);
    return result;
  }

  @InjectManager()
  async createFitments(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment[]> {
    return this.createFitments_(data, ctx);
  }

  @InjectTransactionManager()
  private async createFitments_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment[]> {
    return this.fitmentRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateFitment(
    data: UpdateFitmentInput,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment> {
    const [result] = await this.updateFitments_([data], ctx);
    return result;
  }

  @InjectManager()
  async updateFitments(
    data: UpdateFitmentInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment[]> {
    return this.updateFitments_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitments_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment[]> {
    return this.fitmentRepository_.update(data, ctx);
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

  // ============================================================================
  // Cascade Delete (inlined from FitmentCascadeService)
  // ============================================================================

  @InjectManager()
  async deleteMakeWithCascade(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteMakeWithCascade_(id, ctx);
  }

  @InjectTransactionManager()
  private async deleteMakeWithCascade_(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const models = await this.fitmentModelRepository_.find(
      { where: { make_id: id } },
      ctx,
    );
    for (const model of models) {
      await this.deleteModelWithCascade_(model.id, ctx);
    }
    await this.deleteFitmentMakes_([id], ctx);
  }

  @InjectManager()
  async deleteModelWithCascade(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteModelWithCascade_(id, ctx);
  }

  @InjectTransactionManager()
  private async deleteModelWithCascade_(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const fitments = await this.fitmentRepository_.find(
      { where: { model_id: id } },
      ctx,
    );
    if (fitments.length > 0) {
      await this.deleteFitments_(
        fitments.map((f) => f.id),
        ctx,
      );
    }
    await this.deleteFitmentModels_([id], ctx);
  }

  @InjectManager()
  async deleteEngineWithCascade(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteEngineWithCascade_(id, ctx);
  }

  @InjectTransactionManager()
  private async deleteEngineWithCascade_(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const fitments = await this.fitmentRepository_.find(
      { where: { engine_id: id } },
      ctx,
    );
    if (fitments.length > 0) {
      await this.deleteFitments_(
        fitments.map((f) => f.id),
        ctx,
      );
    }
    await this.deleteFitmentEngines_([id], ctx);
  }

  // ============================================================================
  // Relationship operations (inlined from FitmentRelationshipService)
  // ============================================================================

  @InjectManager()
  async findOrCreateMake(
    name: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentMake> {
    return this.findOrCreateMake_(name, ctx);
  }

  @InjectTransactionManager()
  private async findOrCreateMake_(
    name: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentMake> {
    const [existing] = await this.fitmentMakeRepository_.find(
      { where: { name } },
      ctx,
    );
    if (existing) return existing;
    const [created] = await this.fitmentMakeRepository_.create([{ name }], ctx);
    return created;
  }

  @InjectManager()
  async findOrCreateModel(
    name: string,
    makeId: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentModel> {
    return this.findOrCreateModel_(name, makeId, ctx);
  }

  @InjectTransactionManager()
  private async findOrCreateModel_(
    name: string,
    makeId: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentModel> {
    const [existing] = await this.fitmentModelRepository_.find(
      { where: { name, make_id: makeId } },
      ctx,
    );
    if (existing) return existing;
    const [created] = await this.fitmentModelRepository_.create(
      [{ name, make_id: makeId }],
      ctx,
    );
    return created;
  }

  @InjectManager()
  async findOrCreateEngine(
    data: CreateEngineInput,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentEngine> {
    return this.findOrCreateEngine_(data, ctx);
  }

  @InjectTransactionManager()
  private async findOrCreateEngine_(
    data: CreateEngineInput,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentEngine> {
    const [existing] = await this.fitmentEngineRepository_.find(
      {
        where: {
          fuel: data.fuel,
          type: data.type,
          size: data.size,
          tech: data.tech as undefined,
        },
      },
      ctx,
    );
    if (existing) return existing;
    const [created] = await this.fitmentEngineRepository_.create([data], ctx);
    return created;
  }

  @InjectManager()
  async createModelFromInput(
    dto: CreateModelInput | any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentModel> {
    return this.createModelFromInput_(dto, ctx);
  }

  @InjectTransactionManager()
  private async createModelFromInput_(
    dto: CreateModelInput | any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<FitmentModel> {
    if ("make_id" in dto && dto.make_id) {
      const [model] = await this.fitmentModelRepository_.create(
        [{ name: dto.name, make_id: dto.make_id }],
        ctx,
      );
      return model;
    }
    if ("make" in dto && dto.make) {
      const make = await this.findOrCreateMake_(dto.make.name, ctx);
      const [model] = await this.fitmentModelRepository_.create(
        [{ name: dto.name, make_id: make.id }],
        ctx,
      );
      return model;
    }
    throw new Error("Either make_id or make must be provided");
  }

  // ============================================================================
  // Complex / batch operations
  // ============================================================================

  @InjectManager()
  async updateFullFitment(
    data: UpdateFitmentInput,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment> {
    const [updated] = await this.updateFitments_([data], ctx);
    return updated;
  }

  @InjectManager()
  async createFullFitment(
    dto: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment> {
    return this.createFullFitment_(dto, ctx);
  }

  @InjectTransactionManager()
  private async createFullFitment_(
    dto: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment> {
    const make = await this.findOrCreateMake_(dto.make.name, ctx);
    const model = await this.findOrCreateModel_(dto.model.name, make.id, ctx);
    const engine = await this.findOrCreateEngine_(dto.engine, ctx);

    const fitmentData: any = {
      model_id: model.id,
      engine_id: engine.id,
      body_style: dto.body_style,
      drive: dto.drive,
      transmission: dto.transmission,
      year_start: dto.year_start,
    };
    if (dto.year_end !== undefined) {
      fitmentData.year_end = dto.year_end;
    }

    const [existing] = await this.fitmentRepository_.find(
      { where: fitmentData },
      ctx,
    );
    if (existing) return existing;

    const [created] = await this.fitmentRepository_.create([fitmentData], ctx);
    return created;
  }

  @InjectManager()
  async createFullFitments(
    dtos: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment[]> {
    return this.createFullFitments_(dtos, ctx);
  }

  @InjectTransactionManager()
  private async createFullFitments_(
    dtos: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Fitment[]> {
    const results: Fitment[] = [];
    for (const dto of dtos) {
      const fitment = await this.createFullFitment_(dto, ctx);
      results.push(fitment);
    }
    return results;
  }
}

export default FitmentModuleService;
