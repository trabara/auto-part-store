import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { RbacV2Category } from "./category";
import { RbacV2Policy } from "./policy";

const KindEnum = model.enum(["read", "write", "delete"])
export type PermissionKind = Infer<typeof KindEnum>;

const TypeEnum = model.enum(["predefined", "custom"]);
export type PermissionType = Infer<typeof TypeEnum>;

export const RbacV2Permission = model
  .define("rbac_v2_permission", {
    id: model.id().primaryKey(),
    kind: KindEnum,
    target: model.text().searchable(),
    type: TypeEnum.default("custom"),
    category: model.belongsTo(() => RbacV2Category, {
      mappedBy: "permissions",
    }).nullable(),
    policies: model.hasMany(() => RbacV2Policy, {
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

export type Permission = Infer<typeof RbacV2Permission>;