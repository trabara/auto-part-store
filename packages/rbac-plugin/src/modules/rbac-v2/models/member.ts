import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { RbacV2Role } from "./role";

export const RbacV2Member = model
  .define("rbac_v2_member", {
    id: model.id().primaryKey(),
    user_id: model.text(),
    role: model.belongsTo(() => RbacV2Role, {
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

export type Member = Infer<typeof RbacV2Member>;
