import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { PermissionEntity } from "./permission";

export const CategoryEntity = model
  .define("rbac_category", {
    id: model.id().primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    parent_category: model
      .belongsTo(() => CategoryEntity, {
        mappedBy: "child_categories",
      })
      .nullable(),
    child_categories: model.hasMany(() => CategoryEntity, {
      mappedBy: "parent_category",
    }),
    permissions: model.hasMany(() => PermissionEntity, {
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

export type Category = Infer<typeof CategoryEntity>;
