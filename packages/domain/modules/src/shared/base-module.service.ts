import { Context, DAL } from "@medusajs/framework/types";

/**
 * Plain CRUD helper class for a single-entity repository.
 *
 * Unlike a top-level Medusa module service, this class does NOT use
 * @InjectManager / @InjectTransactionManager decorators. It is designed to be
 * used as a **namespace accessor** on a parent Medusa service that IS
 * registered with the DI container.  The parent service handles manager
 * injection and passes the shared context (ctx) down into these methods.
 *
 * Sub-service instances are created manually in the parent constructor:
 * ```ts
 * this.makes = new FitmentMakeCrudService(
 *   deps.fitmentMakeRepository,
 *   deps.baseRepository,
 * )
 * ```
 */
export abstract class BaseModuleService<T extends { id: string }> {
  protected repository_: DAL.RepositoryService<T>;
  protected baseRepository_: DAL.RepositoryService<any>;
  protected entityName_: string;

  constructor(
    repository: DAL.RepositoryService<T>,
    baseRepository: DAL.RepositoryService<any>,
    entityName?: string,
  ) {
    this.repository_ = repository;
    this.baseRepository_ = baseRepository;
    this.entityName_ = entityName ?? "Entity";
  }

  async list(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    ctx?: Context,
  ): Promise<T[]> {
    return this.repository_.find({ where: filters ?? {} } as any, ctx);
  }

  async listAndCount(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    ctx?: Context,
  ): Promise<[T[], number]> {
    return this.repository_.findAndCount({ where: filters ?? {} } as any, ctx);
  }

  async retrieve(
    id: string,
    _config?: Record<string, any>,
    ctx?: Context,
  ): Promise<T> {
    const [entity] = await this.repository_.find({ where: { id } } as any, ctx);
    if (!entity) throw new Error(`${this.entityName_} with id ${id} not found`);
    return entity;
  }

  async create(data: any[], ctx?: Context): Promise<T[]> {
    return this.repository_.create(data, ctx);
  }

  /**
   * Canonical fetch-then-pair update pattern, strips id from update payload.
   */
  async update(
    data: (Record<string, any> & { id: string })[],
    ctx?: Context,
  ): Promise<T[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.repository_.find(
      { where: { id: { $in: ids } } } as any,
      ctx,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map(({ id, ...update }) => ({ entity: entityMap.get(id)!, update }));
    return this.repository_.update(pairs as any, ctx);
  }

  async delete(ids: string | string[], ctx?: Context): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    await this.repository_.delete({ id: { $in: arr } } as any, ctx);
  }
}

/**
 * Extension of BaseModuleService that adds soft-delete restore support.
 * Used for entities that have a `deleted_at` column (e.g. Fitment).
 */
export abstract class RestorableModuleService<
  T extends { id: string },
> extends BaseModuleService<T> {
  async restore(ids: string[], ctx?: Context): Promise<void> {
    await this.repository_.restore({ id: { $in: ids } } as any, ctx);
  }
}
