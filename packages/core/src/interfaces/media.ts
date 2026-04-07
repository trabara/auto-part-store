import type { IBaseModuleService } from "./base-module-service";

/**
 * Media module service interface.
 * Inherits standard CRUD from IBaseModuleService (list, listAndCount, retrieve,
 * create, update, delete).
 */
export interface IMediaModuleService extends IBaseModuleService<any> {}
