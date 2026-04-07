import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context, DAL, InferTypeOf } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import type { IFitmentModuleService } from "@trabara/core/interfaces";
import {
  BaseModuleService,
  RestorableModuleService,
} from "@repo/domain-modules/shared";
import * as Models from "../models";

type InjectedDependencies = {
  fitmentMakeRepository: DAL.RepositoryService<Models.FitmentMake>;
  fitmentModelRepository: DAL.RepositoryService<Models.FitmentModel>;
  fitmentEngineRepository: DAL.RepositoryService<Models.FitmentEngine>;
  fitmentRepository: DAL.RepositoryService<Models.Fitment>;
  baseRepository: DAL.RepositoryService<any>;
};

// ============================================================================
// Sub-service classes — one per entity group
// ============================================================================

class FitmentMakeCrudService extends BaseModuleService<Models.FitmentMake> {
  constructor(
    repo: DAL.RepositoryService<Models.FitmentMake>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "FitmentMake");
  }
}

class FitmentModelCrudService extends BaseModuleService<Models.FitmentModel> {
  constructor(
    repo: DAL.RepositoryService<Models.FitmentModel>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "FitmentModel");
  }
}

class FitmentEngineCrudService extends BaseModuleService<Models.FitmentEngine> {
  constructor(
    repo: DAL.RepositoryService<Models.FitmentEngine>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "FitmentEngine");
  }
}

class FitmentCrudService extends RestorableModuleService<Models.Fitment> {
  constructor(
    repo: DAL.RepositoryService<Models.Fitment>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "Fitment");
  }
}

// ============================================================================
// Main service — namespace accessor pattern
// ============================================================================

class FitmentModuleService implements IFitmentModuleService {
  readonly makes: FitmentMakeCrudService;
  readonly models: FitmentModelCrudService;
  readonly engines: FitmentEngineCrudService;
  readonly fitments: FitmentCrudService;

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

    this.makes = new FitmentMakeCrudService(
      dependencies.fitmentMakeRepository,
      dependencies.baseRepository,
    );
    this.models = new FitmentModelCrudService(
      dependencies.fitmentModelRepository,
      dependencies.baseRepository,
    );
    this.engines = new FitmentEngineCrudService(
      dependencies.fitmentEngineRepository,
      dependencies.baseRepository,
    );
    this.fitments = new FitmentCrudService(
      dependencies.fitmentRepository,
      dependencies.baseRepository,
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
  ): Promise<Models.FitmentMake[]> {
    return this.makes.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountFitmentMakes(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.FitmentMake[], number]> {
    return this.makes.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel[]> {
    return this.models.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountFitmentModels(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.FitmentModel[], number]> {
    return this.models.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    return this.engines.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountFitmentEngines(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.FitmentEngine[], number]> {
    return this.engines.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.fitments.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountFitments(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Models.Fitment[], number]> {
    return this.fitments.listAndCount(filters, config, ctx);
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
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake[]> {
    return this.createMakes_(data, ctx);
  }

  @InjectTransactionManager()
  private async createMakes_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake[]> {
    return this.fitmentMakeRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateMakes(
    data: (Record<string, any> & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake[]> {
    return this.updateMakes_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateMakes_(
    data: (Record<string, any> & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.fitmentMakeRepository_.find(
      { where: { id: { $in: ids } } } as any,
      ctx,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map(({ id, ...update }) => ({ entity: entityMap.get(id)!, update }));
    return this.fitmentMakeRepository_.update(pairs as any, ctx);
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
    await this.fitmentMakeRepository_.delete({ id: { $in: arr } } as any, ctx);
  }

  @InjectManager()
  async retrieveMake(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake> {
    return this.retrieveMake_(id, ctx);
  }

  @InjectTransactionManager()
  private async retrieveMake_(
    id: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentMake> {
    const [entity] = await this.fitmentMakeRepository_.find(
      { where: { id } } as any,
      ctx,
    );
    if (!entity) throw new Error(`FitmentMake with id ${id} not found`);
    return entity;
  }

  // ── FitmentModels ──────────────────────────────────────────────────────────

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
    data: (Record<string, any> & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel[]> {
    return this.updateFitmentModels_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitmentModels_(
    data: (Record<string, any> & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentModel[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.fitmentModelRepository_.find(
      { where: { id: { $in: ids } } } as any,
      ctx,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map(({ id, ...update }) => ({ entity: entityMap.get(id)!, update }));
    return this.fitmentModelRepository_.update(pairs as any, ctx);
  }

  @InjectManager()
  async deleteFitmentModels(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteFitmentModels_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteFitmentModels_(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    await this.fitmentModelRepository_.delete({ id: { $in: arr } } as any, ctx);
  }

  // ── Engines ────────────────────────────────────────────────────────────────

  @InjectManager()
  async createEngines(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    return this.createEngines_(data, ctx);
  }

  @InjectTransactionManager()
  private async createEngines_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    return this.fitmentEngineRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateEngines(
    data: (Record<string, any> & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    return this.updateEngines_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateEngines_(
    data: (Record<string, any> & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.FitmentEngine[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.fitmentEngineRepository_.find(
      { where: { id: { $in: ids } } } as any,
      ctx,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map(({ id, ...update }) => ({ entity: entityMap.get(id)!, update }));
    return this.fitmentEngineRepository_.update(pairs as any, ctx);
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
    await this.fitmentEngineRepository_.delete(
      { id: { $in: arr } } as any,
      ctx,
    );
  }

  // ── Fitments ───────────────────────────────────────────────────────────────

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
  async updateFitmentsData(
    data: (Record<string, any> & { id: string })[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Models.Fitment[]> {
    return this.updateFitmentsData_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateFitmentsData_(
    data: (Record<string, any> & { id: string })[],
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
}

export default FitmentModuleService;
