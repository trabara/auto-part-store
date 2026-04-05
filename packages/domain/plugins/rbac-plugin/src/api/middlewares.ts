import { defineMiddlewares } from "@medusajs/framework";

import { adminCategoriesMiddlewares } from "./admin/rbac/v2/categories/middlewares";
import { adminPermissionsMiddlewares } from "./admin/rbac/v2/permissions/middlewares";
import { adminRolesMiddlewares } from "./admin/rbac/v2/roles/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminCategoriesMiddlewares,
    ...adminRolesMiddlewares,
    ...adminPermissionsMiddlewares,
  ],
});
