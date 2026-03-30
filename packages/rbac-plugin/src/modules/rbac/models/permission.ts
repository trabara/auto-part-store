import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { CategoryEntity } from "./category";
import { PolicyEntity } from "./policy";

const KindEnum = model.enum(["read", "write", "delete"])
export type PermissionKind = Infer<typeof KindEnum>;

const TypeEnum = model.enum(["predefined", "custom"]);
export type PermissionType = Infer<typeof TypeEnum>;

export const PermissionEntity = model
  .define("rbac_permission", {
    id: model.id().primaryKey(),
    kind: KindEnum,
    target: model.text().searchable(),
    type: TypeEnum.default("custom"),
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

export type Permission = Infer<typeof PermissionEntity>;