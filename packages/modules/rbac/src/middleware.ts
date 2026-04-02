import { authenticate, AuthenticatedMedusaRequest, MedusaNextFunction, MedusaResponse } from "@medusajs/framework";
import AuthzModuleService from "./services/authz-module";
import { AUTHZ_MODULE } from ".";

const authenticateMiddleware = authenticate(["*"], ["session", 'bearer']);


export const rbacMiddleware = (req: AuthenticatedMedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const rbaceService = req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);

    return authenticateMiddleware(req, res, async () => {
        const isAllowed = await rbaceService.userHasAccess(req.auth_context.actor_id, req.path, req.method);

        if (!isAllowed) {
            return res.status(403).json({
                error: "Forbidden",
                message: "You don't have access to this resource",
                statusCode: 403,
            });
        }
        return next();
    });

}