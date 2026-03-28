import { defineMiddlewares } from "@medusajs/framework";

import { adminPermissionsMiddlewares } from "./admin/rbac/permissions/middlewares";
import { adminRolesMiddlewares } from "./admin/rbac/roles/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminRolesMiddlewares,
    ...adminPermissionsMiddlewares,
    // ...adminCategoriesMiddlewares,
    // ...adminCheckMiddlewares,
    // ...adminRbacEnforcement,
  ],
});
