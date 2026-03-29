import { Infer } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { PermEntity } from "./permission";

export const CategoryEntity = model
  .define("rbac_category", {
    id: model.id().primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    parent_category: model.belongsTo(() => CategoryEntity, {
      mappedBy: "id",
    }).nullable(),
    permissions: model.hasMany(() => PermEntity, {
      mappedBy: "category",
    })
  })
  .cascades({
    delete: ["permissions"]
  })
  .indexes([
    {
      on: ["name"],
      unique: true,
      where: "deleted_at IS NULL"
    },
  ]);

export type Category = Infer<typeof CategoryEntity>;
