import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context, DAL } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import { RestorableModuleService } from "@trabara/common";
import type {
  CreateEngineInput,
  CreateFitmentInput,
  CreateMakeInput,
  CreateModelInput,
  UpdateEngineInput,
  UpdateFitmentInput,
  UpdateMakeInput,
  UpdateModelInput,
} from "@trabara/core/dtos";
import * as Models from "../models";
import { EngineService } from "./engine.service";
import { MakeService } from "./make.service";
import { ModelService } from "./model.service";

type InjectedDependencies = {
  fitmentMakeRepository: DAL.RepositoryService<Models.Make>;
  fitmentModelRepository: DAL.RepositoryService<Models.Model>;
  fitmentEngineRepository: DAL.RepositoryService<Models.Engine>;
  fitmentRepository: DAL.RepositoryService<Models.Fitment>;
  baseRepository: DAL.RepositoryService<any>;
};

class FitmentModuleService extends RestorableModuleService<Models.Fitment> {
  readonly makes: MakeService;
  readonly models: ModelService;
  readonly engines: EngineService;

  protected makeRepository_: DAL.RepositoryService<Models.Make>;
  protected modelRepository_: DAL.RepositoryService<Models.Model>;
  protected engineRepository_: DAL.RepositoryService<Models.Engine>;
  protected fitmentRepository_: DAL.RepositoryService<Models.Fitment>;
  protected baseRepository_: DAL.RepositoryService<any>;

  constructor(deps: InjectedDependencies) {
    super(deps.fitmentRepository, deps.baseRepository, "Fitment");
    this.makeRepository_ = deps.fitmentMakeRepository;
    this.modelRepository_ = deps.fitmentModelRepository;
    this.engineRepository_ = deps.fitmentEngineRepository;
    this.fitmentRepository_ = deps.fitmentRepository;
    this.baseRepository_ = deps.baseRepository;

    this.makes = new MakeService(
      deps.fitmentMakeRepository,
      deps.baseRepository,
    );
    this.models = new ModelService(
      deps.fitmentModelRepository,
      deps.baseRepository,
    );
    this.engines = new EngineService(
      deps.fitmentEngineRepository,
      deps.baseRepository,
    );
  }

  // ============================================================================
  // Remote Query joiner delegate methods
  //
  // Medusa's joiner config derives method names from entity names via the
  // convention: `list<PluralEntityName>` / `listAndCount<PluralEntityName>`.
  // These thin wrappers forward to the namespace accessor sub-services so
  // that `query.graph({ entity: "fitment_make" })` continues to work.
  // ============================================================================

  @InjectManager()
  async listFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Make[]> {
    return this.makes.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.Make[], number]> {
    return this.makes.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Model[]> {
    return this.models.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.Model[], number]> {
    return this.models.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Engine[]> {
    return this.engines.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.Engine[], number]> {
    return this.engines.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.Fitment[], number]> {
    return this.listAndCount(filters, config, ctx);
  }

  // ============================================================================
  // @InjectManager()-decorated CRUD delegates — one set per entity group.
  //
  // Each public delegate uses the classic @InjectManager → @InjectTransactionManager
  // pattern so that write operations are properly committed.
  // ============================================================================

  // ── Makes ──────────────────────────────────────────────────────────────────

  @InjectManager()
  async createMakes(
    data: CreateMakeInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Make[]> {
    return this.createMakes_(data, ctx);
  }

  @InjectTransactionManager()
  private async createMakes_(
    data: CreateMakeInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Make[]> {
    return this.makeRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateMakes(
    data: (UpdateMakeInput & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Make[]> {
    return this.updateMakes_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateMakes_(
    data: (UpdateMakeInput & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Make[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.makeRepository_.find(
      { where: { id: { $in: ids } } } as any,
      ctx,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map(({ id, ...update }) => ({ entity: entityMap.get(id)!, update }));
    return this.makeRepository_.update(pairs as any, ctx);
  }

  @InjectManager()
  async deleteMakes(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteMakes_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteMakes_(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    await this.makeRepository_.delete({ id: { $in: arr } } as any, ctx);
  }

  @InjectManager()
  async retrieveMake(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Make> {
    return this.retrieveMake_(id, ctx);
  }

  @InjectTransactionManager()
  private async retrieveMake_(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Make> {
    const [entity] = await this.makeRepository_.find(
      { where: { id } } as any,
      ctx,
    );
    if (!entity) throw new Error(`Make with id ${id} not found`);
    return entity;
  }

  // ── Models ──────────────────────────────────────────────────────────

  @InjectManager()
  async createModels(
    data: CreateModelInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Model[]> {
    return this.createModels_(data, ctx);
  }

  @InjectTransactionManager()
  private async createModels_(
    data: CreateModelInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Model[]> {
    return this.modelRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateModels(
    data: (UpdateModelInput & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Model[]> {
    return this.updateModels_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateModels_(
    data: (UpdateModelInput & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Model[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.modelRepository_.find(
      { where: { id: { $in: ids } } } as any,
      ctx,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map(({ id, ...update }) => ({ entity: entityMap.get(id)!, update }));
    return this.modelRepository_.update(pairs as any, ctx);
  }

  @InjectManager()
  async deleteModels(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteModels_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteModels_(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    await this.modelRepository_.delete({ id: { $in: arr } } as any, ctx);
  }

  // ── Engines ────────────────────────────────────────────────────────────────

  @InjectManager()
  async createEngines(
    data: CreateEngineInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Engine[]> {
    return this.createEngines_(data, ctx);
  }

  @InjectTransactionManager()
  private async createEngines_(
    data: CreateEngineInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Engine[]> {
    return this.engines.create(data, ctx);
  }

  @InjectManager()
  async updateEngines(
    data: (UpdateEngineInput & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Engine[]> {
    return this.updateEngines_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateEngines_(
    data: (UpdateEngineInput & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Engine[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.engineRepository_.find(
      { where: { id: { $in: ids } } } as any,
      ctx,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map(({ id, ...update }) => ({ entity: entityMap.get(id)!, update }));
    return this.engineRepository_.update(pairs as any, ctx);
  }

  @InjectManager()
  async deleteEngines(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteEngines_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteEngines_(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    await this.engineRepository_.delete({ id: { $in: arr } } as any, ctx);
  }

  // ── Fitments ───────────────────────────────────────────────────────────────

  @InjectManager()
  async createFitments(
    data: CreateFitmentInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.createFitments_(data, ctx);
  }

  @InjectTransactionManager()
  private async createFitments_(
    data: CreateFitmentInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.fitmentRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateFitmentsData(
    data: UpdateFitmentInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.updateFitmentsData_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitmentsData_(
    data: UpdateFitmentInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.fitmentRepository_.find(
      { where: { id: { $in: ids } } } as any,
      ctx,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map(({ id, ...update }) => ({ entity: entityMap.get(id)!, update }));
    return this.fitmentRepository_.update(pairs as any, ctx);
  }

  @InjectManager()
  async deleteFitmentsData(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteFitmentsData_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteFitmentsData_(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    await this.fitmentRepository_.delete({ id: { $in: arr } } as any, ctx);
  }

  @InjectManager()
  async retrieveFitmentById(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment> {
    return this.retrieveFitmentById_(id, ctx);
  }

  @InjectTransactionManager()
  private async retrieveFitmentById_(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment> {
    const [entity] = await this.fitmentRepository_.find(
      { where: { id } } as any,
      ctx,
    );
    if (!entity) throw new Error(`Fitment with id ${id} not found`);
    return entity;
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
    await this.fitmentRepository_.restore({ id: { $in: ids } } as any, ctx);
  }

  // ============================================================================
  // listFitmentsWithRelations — cross-repo join, stays as a direct method
  // ============================================================================

  @InjectManager()
  async listFitmentsWithRelations(
    filters?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.listFitmentsWithRelations_(filters, ctx);
  }

  @InjectTransactionManager()
  private async listFitmentsWithRelations_(
    filters?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
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
        ? this.modelRepository_.find({ where: { id: { $in: modelIds } } }, ctx)
        : [],
      engineIds.length
        ? this.engineRepository_.find(
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
      ? await this.makeRepository_.find(
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
}

export default FitmentModuleService;
