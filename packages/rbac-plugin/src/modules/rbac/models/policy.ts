import { model } from "@medusajs/framework/utils";
import { RbacRole } from "./role";
import { RbacPermission } from "./permission";

export const RbacPolicy = model.define("rbac_policy", {
  id: model.id().primaryKey(),
  name: model.enum(["ALLOW", "DENY"]),
  role: model.belongsTo(() => RbacRole, {
    mappedBy: "policies",
  }),
  permission: model.belongsTo(() => RbacPermission, {
    mappedBy: "policies",
  }),
});
