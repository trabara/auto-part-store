import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { RbacV2Permission } from "./permission";

export const RbacV2Category = model
  .define("rbac_v2_category", {
    id: model.id().primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    parent_category: model.
      belongsTo(() => RbacV2Category, {
        mappedBy: "child_categories",
      })
      .nullable(),
    child_categories: model.
      hasMany(() => RbacV2Category, {
        mappedBy: "parent_category",
      }),
    permissions: model.hasMany(() => RbacV2Permission, {
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

export type Category = Infer<typeof RbacV2Category>;
