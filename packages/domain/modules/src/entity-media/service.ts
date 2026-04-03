import { Context, DAL, InferTypeOf } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import EntityImage from "./models/entity-image";
import type { IEntityMediaModuleService } from "@trabara/core/interfaces";

type EntityImageType = InferTypeOf<typeof EntityImage>;

type InjectedDependencies = {
  entityImageRepository: DAL.RepositoryService<EntityImageType>;
  baseRepository: DAL.RepositoryService<any>;
};

class EntityMediaModuleService implements IEntityMediaModuleService {
  protected entityImageRepository_: DAL.RepositoryService<EntityImageType>;
  protected baseRepository_: DAL.RepositoryService<any>;

  constructor(dependencies: InjectedDependencies) {
    this.entityImageRepository_ = dependencies.entityImageRepository;
    this.baseRepository_ = dependencies.baseRepository;
  }

  @InjectManager()
  async listEntityImages(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<EntityImageType[]> {
    return this.listEntityImages_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listEntityImages_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<EntityImageType[]> {
    return this.entityImageRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountEntityImages(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[EntityImageType[], number]> {
    return this.listAndCountEntityImages_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountEntityImages_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[EntityImageType[], number]> {
    return this.entityImageRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async retrieveEntityImage(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<EntityImageType> {
    return this.retrieveEntityImage_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveEntityImage_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<EntityImageType> {
    const [image] = await this.entityImageRepository_.find(
      { where: { id } },
      ctx,
    );
    if (!image) throw new Error(`EntityImage with id ${id} not found`);
    return image;
  }

  @InjectManager()
  async createEntityImages(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<EntityImageType[]> {
    return this.createEntityImages_(data, ctx);
  }

  @InjectTransactionManager()
  private async createEntityImages_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<EntityImageType[]> {
    return this.entityImageRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateEntityImages(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<EntityImageType[]> {
    return this.updateEntityImages_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateEntityImages_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<EntityImageType[]> {
    return this.entityImageRepository_.update(data, ctx);
  }

  @InjectManager()
  async deleteEntityImages(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteEntityImages_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteEntityImages_(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    await this.entityImageRepository_.delete({ id: { $in: arr } }, ctx);
  }
}

export default EntityMediaModuleService;
