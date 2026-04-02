import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { AuthzPermission } from "./permission";

export const AuthzCategory = model
  .define("authz_category", {
    id: model.id().primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    parent_category: model.
      belongsTo(() => AuthzCategory, {
        mappedBy: "child_categories",
      })
      .nullable(),
    child_categories: model.
      hasMany(() => AuthzCategory, {
        mappedBy: "parent_category",
      }),
    permissions: model.hasMany(() => AuthzPermission, {
      mappedBy: "category",
    }),
  })
  .cascades({
    delete: ["permissions"],
  })
  .indexes([
    {
      on: ["name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);

export type AuthzCategory = Infer<typeof AuthzCategory>;
