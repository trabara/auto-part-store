import {
  authenticate,
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import AuthzModuleService from "./services/authz.service";
import { AUTHZ_MODULE } from "./constant";

const authenticateMiddleware = authenticate(["*"], ["session", "bearer"]);

export const rbacMiddleware = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const rbacService = req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);

  return authenticateMiddleware(req, res, async () => {
    const isAllowed = await rbacService.userHasAccess(
      req.auth_context.actor_id,
      req.path,
      req.method,
    );

    if (!isAllowed) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have access to this resource",
        statusCode: 403,
      });
    }
    return next();
  });
};
