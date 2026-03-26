import { model } from "@medusajs/framework/utils";

export const RbacPolicy = model.define("rbac_policy", {
  id: model.id().primaryKey(),
  name: model.enum(["ALLOW", "DENY"]),
  permission_id: model.text(),
  role_id: model.text(),
});
