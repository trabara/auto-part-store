import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context, DAL } from "@medusajs/framework/types";
import { Member } from "@trabara/core";
import { BaseModuleService } from "@trabara/common";

export class AuthzMemberCrudService extends BaseModuleService<Member> {
  constructor(
    repo: DAL.RepositoryService<Member>,
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