import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { AuthzMember } from "./member";
import { AuthzPolicy } from "./policy";

export const AuthzRole = model.define("authz_role", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  policies: model.hasMany(() => AuthzPolicy, {
    mappedBy: "role",
  }),
  members: model.hasMany(() => AuthzMember, {
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

export type AuthzRole = Infer<typeof AuthzRole>;
