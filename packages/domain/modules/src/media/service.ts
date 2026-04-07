import { Context, DAL } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type { CreateMediaInput, UpdateMediaInput } from "@trabara/core/dtos";
import type { IMediaModuleService } from "@trabara/core/interfaces";
import { BaseModuleService } from "../shared";
import type { Media } from "./models/media";

type InjectedDependencies = {
  entityMediaRepository: DAL.RepositoryService<Media>;
  baseRepository: DAL.RepositoryService<any>;
};

class MediaModuleService
  extends BaseModuleService<Media>
  implements IMediaModuleService
{
  constructor(dependencies: InjectedDependencies) {
    super(
      dependencies.entityMediaRepository,
      dependencies.baseRepository,
      "Media",
    );
  }

  // ============================================================================
  // CRUD overrides with @InjectManager() so callers without a ctx work.
  // The base class methods have no decorators — this service IS the top-level
  // registered Medusa service, so it must own the manager injection.
  // ============================================================================

  @InjectManager()
  override async list(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return this.list_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async list_(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return super.list(filters, config, ctx);
  }

  @InjectManager()
  override async listAndCount(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Media[], number]> {
    return this.listAndCount_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCount_(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Media[], number]> {
    return super.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  override async retrieve(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media> {
    return this.retrieve_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieve_(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media> {
    return super.retrieve(id, config, ctx);
  }

  @InjectManager()
  override async create(
    data: CreateMediaInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return this.create_(data, ctx);
  }

  @InjectTransactionManager()
  private async create_(
    data: CreateMediaInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return super.create(data, ctx);
  }

  @InjectManager()
  override async update(
    data: UpdateMediaInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return this.update_(data, ctx);
  }

  @InjectTransactionManager()
  private async update_(
    data: UpdateMediaInput[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return super.update(data, ctx);
  }

  @InjectManager()
  override async delete(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.delete_(ids, ctx);
  }

  @InjectTransactionManager()
  private async delete_(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return super.delete(ids, ctx);
  }

  // ============================================================================
  // Remote Query joiner delegate methods
  // entity "entity_media" → listEntityMedias / listAndCountEntityMedias
  // ============================================================================

  @InjectManager()
  async listEntityMedias(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Media[]> {
    return this.list_(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountEntityMedias(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Media[], number]> {
    return this.listAndCount_(filters, config, ctx);
  }
}

export default MediaModuleService;
