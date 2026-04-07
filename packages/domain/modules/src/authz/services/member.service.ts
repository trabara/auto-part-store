import { Context, DAL } from "@medusajs/framework/types";
import { BaseModuleService } from "../../shared";
import * as Models from "../models";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";

export class AuthzMemberCrudService extends BaseModuleService<Models.AuthzMember> {
  constructor(
    repo: DAL.RepositoryService<Models.AuthzMember>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "AuthzMember");
  }

  // Override delete to accept flexible filter objects (e.g. { role_id: ... })
  override async delete(
    ids: string | string[] | Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<void> {
    await (this.repository_ as any).delete(ids as any, ctx);
  }
}