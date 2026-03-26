import { model } from "@medusajs/framework/utils";
import { RbacCategory } from "./category";
import { RbacPolicy } from "./policy";

export const RbacPermission = model
  .define("rbac_permission", {
    id: model.id().primaryKey(),
    kind: model.enum(["read", "write", "delete"]),
    target: model.text(),
    type: model.enum(["predefined", "custom"]).default("custom"),
    category: model.belongsTo(() => RbacCategory, {
      mappedBy: "permissions",
    }),
    policies: model.hasMany(() => RbacPolicy, {
      mappedBy: "permission",
    })
  })
  .indexes([
    {
      on: ["kind", "target"],
      unique: true,
    },
  ]);
