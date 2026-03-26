import { AuthenticatedMedusaRequest, MedusaNextFunction, MedusaResponse } from "@medusajs/framework";
import { RBAC_MODULE, RbacModuleService } from "../modules/rbac";

const rbacCheckMiddleware = async (req: AuthenticatedMedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  try {
    const rbacService = req.scope.resolve<RbacModuleService>(RBAC_MODULE);


    const hasAccess = await rbacService.hasAccess(req.auth_context.actor_id, req.method, req.path);

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    console.error("RBAC middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { rbacCheckMiddleware };
