import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { PermissionEntity } from "./permission";
import { RoleEntity } from "./role";

export const PolicyEntity = model.define("rbac_policy", {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
  role: model.belongsTo(() => RoleEntity, {
    mappedBy: "policies",
  }),
  permission: model.belongsTo(() => PermissionEntity, {
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

export type Policy = Infer<typeof PolicyEntity>;