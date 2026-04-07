import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";

/**
 * Generic CRUD interface for a single-entity module service.
 *
 * All concrete service interfaces for single-entity modules extend this.
 * Multi-entity services (Fitment, Authz) use the namespace accessor pattern
 * and expose typed sub-service instances that each implement this interface.
 */
export interface IBaseModuleService<T> {
  list(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<T[]>;

  listAndCount(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[T[], number]>;

  retrieve(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<T>;

  create(data: any[], sharedContext?: Context<EntityManager>): Promise<T[]>;

  update(
    data: (Record<string, any> & { id: string })[],
    sharedContext?: Context<EntityManager>,
  ): Promise<T[]>;

  delete(
    ids: string | string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}

/**
 * Extension of IBaseModuleService that adds soft-delete restore support.
 */
export interface IRestorableModuleService<T> extends IBaseModuleService<T> {
  restore(ids: string[], sharedContext?: Context<EntityManager>): Promise<void>;
}
