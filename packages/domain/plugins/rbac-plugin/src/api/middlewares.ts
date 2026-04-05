import { defineMiddlewares } from "@medusajs/framework";

import { adminCategoriesMiddlewares } from "./admin/rbac/v2/categories/middlewares";
import { adminMembersMiddlewares } from "./admin/rbac/v2/members/middlewares";
import { adminPermissionsMiddlewares } from "./admin/rbac/v2/permissions/middlewares";
import { adminRolesMiddlewares } from "./admin/rbac/v2/roles/middlewares";
import { adminStatsMiddlewares } from "./admin/rbac/v2/stats/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminCategoriesMiddlewares,
    ...adminMembersMiddlewares,
    ...adminRolesMiddlewares,
    ...adminPermissionsMiddlewares,
    ...adminStatsMiddlewares,
  ],
});
