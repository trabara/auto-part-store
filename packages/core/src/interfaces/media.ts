import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";

export interface IMediaModuleService {
  listMedias(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  retrieveMedia(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createMedias(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  updateMedias(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteMedias(
    ids: string | string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}
