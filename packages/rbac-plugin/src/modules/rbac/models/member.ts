import { model } from "@medusajs/framework/utils";

export const RbacMember = model.define("rbac_member", {
  id: model.id().primaryKey(),
  user_id: model.text(),
  role_id: model.text().nullable(),
});
