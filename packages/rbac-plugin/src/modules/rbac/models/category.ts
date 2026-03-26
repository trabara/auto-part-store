import { model } from "@medusajs/framework/utils";
import { RbacPermission } from "./permission";

export const RbacCategory = model
  .define("rbac_category", {
    id: model.id().primaryKey(),
    name: model.text(),
    description: model.text().nullable(),
    permissions: model.hasMany(() => RbacPermission, {
      mappedBy: "category",
    })
  })

  .indexes([
    {
      on: ["name"],
      unique: true,
    },
  ]);
