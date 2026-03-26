import { model } from "@medusajs/framework/utils";

export const RbacRole = model.define("rbac_role", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  is_default: model.boolean().default(false),
});
