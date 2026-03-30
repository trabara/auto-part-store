import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { RbacV2Permission } from "./permission";
import { RbacV2Role } from "./role";

export const RbacV2Policy = model.define("rbac_v2_policy", {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
  role: model.belongsTo(() => RbacV2Role, {
    mappedBy: "policies",
  }),
  permission: model.belongsTo(() => RbacV2Permission, {
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

export type Policy = Infer<typeof RbacV2Policy>;