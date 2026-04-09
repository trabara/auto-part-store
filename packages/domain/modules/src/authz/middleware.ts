import {
  authenticate,
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import AuthzModuleService from "./services/authz-module.service";
import { AUTHZ_MODULE } from "./constant";
import { Modules } from "@medusajs/framework/utils";

const authenticateMiddleware = authenticate(["*"], ["session", "bearer"]);

export const rbacMiddleware = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const rbacService = req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
  const cacheService = req.scope.resolve(Modules.CACHE);

  return authenticateMiddleware(req, res, async () => {
    const cacheKey = `rbac:${req.auth_context.actor_id}:${req.path}:${req.method}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached === null) {
      const isAllowed = await rbacService.userHasAccess(
        req.auth_context.actor_id,
        req.path,
        req.method,
      );

      await cacheService.set(cacheKey, isAllowed, 60);
    }

    if (cached === false) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have permission to access this resource",
        statusCode: 403,
      });
    }

    return next();
  });
};