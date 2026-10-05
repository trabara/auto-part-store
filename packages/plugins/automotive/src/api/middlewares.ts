import { defineMiddlewares } from "@medusajs/framework";
import { validateEntityBody, validateEntityQuery } from "@repo/framework/entity";
import { EXPOSED_ENTITIES } from "./admin/automotive/entities";

// Validation, filters and allowed fields all come from the entity definitions;
// entities not in EXPOSED_ENTITIES get a 404.
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/automotive/:entity",
      method: "GET",
      middlewares: [validateEntityQuery(EXPOSED_ENTITIES, { isList: true })],
    },
    {
      matcher: "/admin/automotive/:entity/:id",
      method: "GET",
      middlewares: [validateEntityQuery(EXPOSED_ENTITIES)],
    },
    {
      matcher: "/admin/automotive/:entity",
      method: "POST",
      middlewares: [validateEntityBody(EXPOSED_ENTITIES, "create")],
    },
    {
      matcher: "/admin/automotive/:entity",
      method: "PUT",
      middlewares: [validateEntityBody(EXPOSED_ENTITIES, "batchUpdate")],
    },
    {
      matcher: "/admin/automotive/:entity/:id",
      method: "PUT",
      middlewares: [validateEntityBody(EXPOSED_ENTITIES, "update")],
    },
  ],
});
