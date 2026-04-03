import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";

export interface IEntityMediaModuleService {
  listEntityImages(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  retrieveEntityImage(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createEntityImages(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  updateEntityImages(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteEntityImages(
    ids: string | string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}
