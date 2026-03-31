import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils";
import {
  EXCLUDED_ROUTES
} from "../constant";
import * as Models from "../models";
import { AssignUsersInput, Category, CreateCategoryInput, CreatePermissionInput } from "../schema";

export default class AuthzModuleService extends MedusaService(Models) {
  // __hooks = {
  //   onApplicationStart: async () => {
  //     this.onApplicationStart()
  //   },
  // }

  // async onApplicationStart(): Promise<void> {
  //   await this.syncRegisteredPolicies()
  // }

  @InjectManager()
  async createPermissionCategory(
    dto: CreateCategoryInput,
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<Category> {

    return await this.createPermissionCategory_(dto, sharedContext);
  }

  @InjectManager()
  async createPermissionCategories(
    dtos: CreateCategoryInput[],
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<Category[]> {

    const categories: Category[] = [];
    for await (const dto of dtos) {
      const category = await this.createPermissionCategory_(dto, sharedContext);
      categories.push(category);
    }
    return categories;
  }

  @InjectManager()
  async deletePermissionsByCategoryIds(
    categoryIds: string[],
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    for await (const categoryId of categoryIds) {
      await this.deletePermissionsByCategoryId_(categoryId, sharedContext);
    }
  }

  @InjectTransactionManager()
  async createPermissionCategory_(
    dto: CreateCategoryInput,
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<Category> {

    const category = await this.createAuthzCategories(
      {
        name: dto.name,
        description: dto.description,
      },
      sharedContext,
    );

    const permsToCreate: CreatePermissionInput[] = dto.perms.map((p) => ({
      kind: p.kind,
      target: p.target,
      type: p.type,
      category_id: category.id,
    }));

    await this.createAuthzPermissions(permsToCreate, sharedContext);
    return category;
  }

  @InjectTransactionManager()
  async deletePermissionsByCategoryId_(
    categoryId: string,
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    const permissions = await this.listAuthzPermissions(
      {
        category_id: categoryId,
      },
      {},
      sharedContext,
    );

    const permissionIds = permissions.map((p) => p.id);
    if (permissionIds.length) {
      await this.deleteAuthzPermissions(
        {
          id: permissionIds,
        },
        sharedContext,
      );
    }
  }

  // const categoryMap = new Map<string, string>();
  // for (const cat of DEFAULT_CATEGORIES) {
  //   const created = await this.createAuthzCategories(cat, sharedContext);
  //   categoryMap.set(cat.name, created.id);
  // }

  // for (const p of PREDEFINED_PERMISSIONS) {
  //   const categoryId = categoryMap.get(p.category) || null;
  //   await this.createAuthzPermissions(
  //     {
  //       kind: p.kind as "read" | "write" | "delete",
  //       target: p.target,
  //       type: "predefined",
  //       category_id: categoryId,
  //     },
  //     sharedContext,
  //   );
  // }


  public async userHasAccess(
    userId: string,
    resource: string,
    method: string,
  ): Promise<boolean> {
    if (this.isExcludedRoute(resource)) {
      return true;
    }

    const [member] = await this.listAuthzMembers({
      user_id: userId,
    });

    if (!member || !member.role_id) {
      return false;
    }

    const role = await this.retrieveAuthzRole(member.role_id, {
      relations: ["policies", "policies.permission"],
    });

    if (!role) {
      return false;
    }

    const action = this.methodToAction(method);
    return role.policies.some(({ permission }) => {
      if (permission.type === "predefined") {
        return permission.target === resource && permission.kind === action;
      }
      // for custom policies, we can have more complex logic, for now we just check if the target matches
      return permission.target === resource;
    });
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

    //if userIds is empty, we should still remove all existing members from the role
    if (userIds.length === 0) {

      await this.deleteAuthzMembers(
        {
          role_id: roleId,
        },
        sharedContext,
      );

    }

    const membersResult = await this.listAuthzMembers(
      {
        user_id: userIds,
      },
      {},
      sharedContext,
    );

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
