import { model } from "@medusajs/framework/utils";
import { RbacRole } from "./role";

export const RbacMember = model.define("rbac_member", {
  id: model.id().primaryKey(),
  user_id: model.text(),
  role: model.belongsTo(() => RbacRole, {
    mappedBy: "members",
  }),
});
