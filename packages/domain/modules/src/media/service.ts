import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context, DAL } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import type { IMediaModuleService } from "@trabara/core/interfaces";
import type { Media } from "./models/media";

type InjectedDependencies = {
  entityMediaRepository: DAL.RepositoryService<Media>;
  baseRepository: DAL.RepositoryService<any>;
};

class MediaModuleService implements IMediaModuleService {
  protected entityMediaRepository_: DAL.RepositoryService<Media>;
  protected baseRepository_: DAL.RepositoryService<any>;

  constructor(dependencies: InjectedDependencies) {
    this.entityMediaRepository_ = dependencies.entityMediaRepository;
    this.baseRepository_ = dependencies.baseRepository;
  }

  @InjectManager()
  async listMedias(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return this.listMedias_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listMedias_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return this.entityMediaRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountMedias(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Media[], number]> {
    return this.listAndCountMedias_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountMedias_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Media[], number]> {
    return this.entityMediaRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async retrieveMedia(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media> {
    return this.retrieveMedia_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveMedia_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media> {
    const [media] = await this.entityMediaRepository_.find(
      { where: { id } },
      ctx,
    );
    if (!media) throw new Error(`Media with id ${id} not found`);
    return media;
  }

  @InjectManager()
  async createMedias(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return this.createMedias_(data, ctx);
  }

  @InjectTransactionManager()
  private async createMedias_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return this.entityMediaRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateMedias(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return this.updateMedias_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateMedias_(
    data: any[],
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.entityMediaRepository_.find(
      { where: { id: { $in: ids } } },
      ctx,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map((d) => ({ entity: entityMap.get(d.id)!, update: d }));
    return this.entityMediaRepository_.update(pairs, ctx);
  }

  @InjectManager()
  async deleteMedias(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteMedias_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteMedias_(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    await this.entityMediaRepository_.delete({ id: { $in: arr } }, ctx);
  }
}

export default MediaModuleService;
