import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { MemberEntity } from "./member";
import { PolicyEntity } from "./policy";

export const RoleEntity = model.define("rbac_role", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  policies: model.hasMany(() => PolicyEntity, {
    mappedBy: "role",
  }),
  members: model.hasMany(() => MemberEntity, {
    mappedBy: "role",
  }),
}).cascades({
  delete: ["policies", "members"]
}).indexes([
  {
    on: ["name"],
    unique: true,
    where: "deleted_at IS NULL"
  },
]);

export type Role = Infer<typeof RoleEntity>;
