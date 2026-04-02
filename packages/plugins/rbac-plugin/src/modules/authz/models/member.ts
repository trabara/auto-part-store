import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { AuthzRole } from "./role";

export const AuthzMember = model
  .define("authz_member", {
    id: model.id().primaryKey(),
    user_id: model.text(),
    role: model.belongsTo(() => AuthzRole, {
      mappedBy: "members",
    }),
  })
  .indexes([
    {
      on: ["user_id", "role_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

export type AuthzMember = Infer<typeof AuthzMember>;
