import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { RbacV2Member } from "./member";
import { RbacV2Policy } from "./policy";

export const RbacV2Role = model.define("rbac_v2_role", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  policies: model.hasMany(() => RbacV2Policy, {
    mappedBy: "role",
  }),
  members: model.hasMany(() => RbacV2Member, {
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

export type Role = Infer<typeof RbacV2Role>;
