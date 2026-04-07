import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type { CreateMediaInput, Media, UpdateMediaInput } from "../dtos";
import type { IBaseModuleService } from "./base-module-service";

/**
 * Media module service interface.
 * Inherits standard CRUD from IBaseModuleService (list, listAndCount, retrieve,
 * create, update, delete).
 */
export interface IMediaModuleService extends IBaseModuleService<Media> {
  create(
    data: CreateMediaInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<Media[]>;

  update(
    data: UpdateMediaInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<Media[]>;

  // Remote Query joiner delegates (entity name: "entity_media")
  listEntityMedias(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<Media[]>;

  listAndCountEntityMedias(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[Media[], number]>;
}
