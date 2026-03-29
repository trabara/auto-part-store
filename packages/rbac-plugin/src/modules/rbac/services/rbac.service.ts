import { InjectManager, InjectTransactionManager, MedusaService } from "@medusajs/framework/utils";
import { EXCLUDED_ROUTES } from "../constant";
import { CategoryEntity, MemberEntity, PermEntity, PolicyEntity, RoleEntity } from "../models";

class RbacModuleService extends MedusaService({
  CategoryEntity,
  PermEntity,
  PolicyEntity,
  RoleEntity,
  MemberEntity,
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
    userIds: string[]
  ): Promise<void> {

    // const existingMembers = await this.listRbacMembers({
    //   user_id: userIds
    // });

    // // let member;
    // for (const userId of userIds) {
    //   await this.createRbacMembers({
    //     user_id: userId,
    //     role_id: roleId,
    //   });
    //   // member = existingMembers.find((member) => member.user_id === userId);

    //   // if (member) {
    //   //   await this.updateRbacMembers(member.id, { role_id: roleId });
    //   // } else {

    //   // }
    // }
  }

  @InjectManager()
  async assignUsers(roleId: string, userIds: string[]): Promise<void> {
    await this.assignUsers_(roleId, userIds);
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
