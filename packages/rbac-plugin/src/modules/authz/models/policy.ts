import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { AuthzPermission } from "./permission";
import { AuthzRole } from "./role";

export const AuthzPolicy = model.define("authz_policy", {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
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
    unique: true,
    where: "deleted_at IS NULL"
  },
  {
    on: ["permission_id"],
    unique: true,
    where: "deleted_at IS NULL"
  },
  {
    on: ["name"],
    unique: true,
    where: "deleted_at IS NULL"
  }
]);

export type AuthzPolicy = Infer<typeof AuthzPolicy>;