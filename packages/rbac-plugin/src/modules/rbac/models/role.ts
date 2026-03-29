import { model } from "@medusajs/framework/utils";
import { RbacPolicy } from "./policy";

export const RbacRole = model.define("rbac_role", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  is_default: model.boolean().default(false),
  policies: model.hasMany(() => RbacPolicy, {
    mappedBy: "role",
  })
}).cascades({
  delete: ["policies"]
})

