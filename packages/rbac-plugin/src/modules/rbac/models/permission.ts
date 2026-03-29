import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { CategoryEntity } from "./category";
import { PolicyEntity } from "./policy";

export const PermEntity = model
  .define("rbac_permission", {
    id: model.id().primaryKey(),
    kind: model.enum(["read", "write", "delete"]),
    target: model.text().searchable(),
    type: model.enum(["predefined", "custom"]).default("custom"),
    category: model.belongsTo(() => CategoryEntity, {
      mappedBy: "permissions",
    }).nullable(),
    policies: model.hasMany(() => PolicyEntity, {
      mappedBy: "permission",
    })
  })
  .cascades({
    delete: ["policies"]
  })
  .indexes([
    {
      on: ["kind", "target"],
      unique: true,
      where: "deleted_at IS NULL"
    },
  ]);

export type Permission = Infer<typeof PermEntity>;