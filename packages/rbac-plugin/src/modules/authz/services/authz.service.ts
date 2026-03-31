import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils";
import {
  DEFAULT_CATEGORIES,
  EXCLUDED_ROUTES,
  PREDEFINED_PERMISSIONS,
} from "../constant";
import * as Models from "../models";
import { AssignUsersInput } from "../schema";

export default class AuthzModuleService extends MedusaService(Models) {
  __hooks = {
    onApplicationStart: async () => {
      this.onApplicationStart()
    },
  }

  async onApplicationStart(): Promise<void> {
    console.log("Syncing registered policies...")
    await this.syncRegisteredPolicies()
  }

  @InjectManager()
  async syncRegisteredPolicies(
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    const [_, count] = await this.listAndCountAuthzCategories(
      {},
      {},
      sharedContext,
    );
    console.log(`Found ${count} existing categories.`)
    if (count > 0) {
      return;
    }

    const categoryMap = new Map<string, string>();
    for (const cat of DEFAULT_CATEGORIES) {
      const created = await this.createAuthzCategories(cat, sharedContext);
      categoryMap.set(cat.name, created.id);
    }

    for (const p of PREDEFINED_PERMISSIONS) {
      const categoryId = categoryMap.get(p.category) || null;
      await this.createAuthzPermissions(
        {
          kind: p.kind as "read" | "write" | "delete",
          target: p.target,
          type: "predefined",
          category_id: categoryId,
        },
        sharedContext,
      );
    }
  }

  public async userHasAccess(
    userId: string,
    path: string,
    resource: string,
  ): Promise<boolean> {
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

  @InjectManager()
  public async assignRbacUsers(
    roleId: string,
    input: AssignUsersInput,
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    await this.assignRbacUsers_(roleId, input.userIds, sharedContext);
  }

  @InjectTransactionManager()
  protected async assignRbacUsers_(
    roleId: string,
    userIds: string[],
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<void> {


    const membersResult = await this.listAuthzMembers(
      {
        user_id: userIds,
      },
      {},
      sharedContext,
    );

    // if userIds is empty, we should still remove all existing members from the role
    // if(userIds.length === 0) {
    //   const membersToRemove = membersResult.filter((m) => m.role_id === roleId).map((m) => m.id);
    //   await this.updateAuthzMembers(
    //     [{}],
    //     sharedContext,
    //   );
    //   return;
    // }

    let member;
    for (const userId of userIds) {
      member = membersResult.find((m) => m.user_id === userId);

      if (member) {
        await this.updateAuthzMembers([
          { ...member, role_id: roleId },
        ], sharedContext);
      } else {
        await this.createAuthzMembers([{
          user_id: userId,
          role_id: roleId,
        }], sharedContext);
      }
    }
  }



  private isExcludedRoute(path: string): boolean {
    return EXCLUDED_ROUTES.some((route) => path.startsWith(route));
  }

  private methodToAction(method: string): string {
    const map: Record<string, string> = {
      GET: "read",
      POST: "write",
      PUT: "write",
      DELETE: "delete",
    };
    return map[method] || method.toLowerCase();
  }
}
