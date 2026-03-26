import { MedusaService } from "@medusajs/framework/utils";
import {
  RbacCategory,
  RbacMember,
  RbacPermission,
  RbacPolicy,
  RbacRole,
} from "../models";
import { Role } from "../schema";
import { EXCLUDED_ROUTES } from "../constant";

class RbacModuleService extends MedusaService({
  RbacCategory,
  RbacPermission,
  RbacPolicy,
  RbacMember,
  RbacRole,
}) {

  public async hasAccess(userId: string, path: string, resource: string) {

    if (this.isExcludedRoute(path)) {
      return true;
    }


    const [member] = await this.listRbacMembers({
      user_id: userId,
    });

    if (!member || !member.role_id) {
      return false;
    }

    const role = await this.retrieveRbacRole(member.role_id, {
      relations: ["policies", "policies.permission"],
    }) as Role;

    if (!role) {
      return false;
    }

    const action = this.methodToAction(path);
    const matchedPolicy = role.policies.find((policy: any) => {
      const permission = policy.permission;
      if (!permission) return false;

      if (permission.target === resource && permission.kind === action) {
        return true;
      }

      const targetWithoutId = permission.target.replace(/\/[^/]+$/, "");
      if (resource.startsWith(targetWithoutId) && permission.kind === action) {
        return true;
      }

      return false;
    });

    return matchedPolicy?.name !== "DENY";
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
