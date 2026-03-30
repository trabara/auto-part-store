import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context } from "@medusajs/framework/types";
import { InjectManager, InjectTransactionManager, MedusaContext, MedusaService } from "@medusajs/framework/utils";
import { EXCLUDED_ROUTES } from "../constant";
import {
  CategoryEntity,
  MemberEntity,
  PermissionEntity,
  PolicyEntity,
  RoleEntity,
} from "../models";

class RbacModuleService extends MedusaService({
  Category: CategoryEntity,
  Member: MemberEntity,
  Role: RoleEntity,
  Permission: PermissionEntity,
  Policy: PolicyEntity,
}) {

  public async userHasAccess(userId: string, path: string, resource: string): Promise<boolean> {

    // if (this.isExcludedRoute(path)) {
    //   return true;
    // }


    // const [member] = await this.listRbacMembers({
    //   user_id: userId,
    // });

    // if (!member || !member.role_id) {
    //   return false;
    // }

    // const role = await this.retrieveRbacRole(member.role_id, {
    //   relations: ["policies", "policies.permission"],
    // }) as Role;

    // if (!role) {
    //   return false;
    // }

    // const action = this.methodToAction(path);
    // const matchedPolicy = role.policies.find((policy: any) => {
    //   const permission = policy.permission;
    //   if (!permission) return false;

    //   if (permission.target === resource && permission.kind === action) {
    //     return true;
    //   }

    //   const targetWithoutId = permission.target.replace(/\/[^/]+$/, "");
    //   if (resource.startsWith(targetWithoutId) && permission.kind === action) {
    //     return true;
    //   }

    //   return false;
    // });

    // return matchedPolicy?.name !== "DENY";

    return false;
  }

  @InjectTransactionManager()
  protected async assignUsers_(
    roleId: string,
    userIds: string[],
    @MedusaContext()
    sharedContext?: Context<EntityManager>
  ): Promise<void> {

    const existingMembers = await this.listMembers({
      user_id: userIds
    }, {}, sharedContext);

    let member;
    for (const userId of userIds) {
      member = existingMembers.find((m) => m.user_id === userId)

      if (member) {
        await this.updateMembers(member.id, { role_id: roleId }, sharedContext);
      } else {
        await this.createMembers({
          user_id: userId,
          role_id: roleId,
        }, sharedContext);
      }
    }
  }

  @InjectManager()
  async assignUsers(
    roleId: string,
    userIds: string[],
    @MedusaContext()
    sharedContext?: Context<EntityManager>
  ): Promise<void> {
    await this.assignUsers_(roleId, userIds, sharedContext);
  }

  private isExcludedRoute(path: string): boolean {
    return EXCLUDED_ROUTES.some((route) => path.startsWith(route));
  };

  private methodToAction(method: string): string {
    const map: Record<string, string> = {
      GET: "read",
      POST: "write",
      PUT: "write",
      DELETE: "delete",
    };
    return map[method] || method.toLowerCase();
  };
}

export default RbacModuleService;
