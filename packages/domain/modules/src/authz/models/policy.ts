import { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { AuthzPermission } from "./permission";
import { AuthzRole } from "./role";

export const AuthzPolicy = model.define("authz_policy", {
  id: model.id().primaryKey(),
  role: model.belongsTo(() => AuthzRole, {
    mappedBy: "policies",
  }),
  permission: model.belongsTo(() => AuthzPermission, {
    mappedBy: "policies",
  }),
  metadata: model.json().nullable(),
}).indexes([
  {
    on: ["role_id"],
    where: "deleted_at IS NULL"
  },
  {
    on: ["permission_id"],
    where: "deleted_at IS NULL"
  }
]);

export type AuthzPolicy = InferTypeOf<typeof AuthzPolicy>;