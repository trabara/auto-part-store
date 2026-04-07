import { Infer, InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { AuthzCategory } from "./category";
import { AuthzPolicy } from "./policy";

const KindEnum = model.enum(["read", "write", "delete"])
export type PermissionKind = Infer<typeof KindEnum>;

const TypeEnum = model.enum(["predefined", "custom"]);
export type PermissionType = Infer<typeof TypeEnum>;

export const AuthzPermission = model
  .define("authz_permission", {
    id: model.id().primaryKey(),
    kind: KindEnum,
    target: model.text().searchable(),
    type: TypeEnum.default("custom"),
    category: model.belongsTo(() => AuthzCategory, {
      mappedBy: "permissions",
    }).nullable(),
    policies: model.hasMany(() => AuthzPolicy, {
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

export type AuthzPermission = InferTypeOf<typeof AuthzPermission>;