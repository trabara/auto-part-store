import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { RoleEntity } from "./role";

export const MemberEntity = model
  .define("rbac_member", {
    id: model.id().primaryKey(),
    user_id: model.text(),
    role: model.belongsTo(() => RoleEntity, {
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

export type Member = Infer<typeof MemberEntity>;
