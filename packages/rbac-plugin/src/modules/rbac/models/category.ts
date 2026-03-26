import { model } from "@medusajs/framework/utils";

export const RbacCategory = model
  .define("rbac_category", {
    id: model.id().primaryKey(),
    name: model.text(),
    description: model.text().nullable(),
  })
  .indexes([
    {
      on: ["name"],
      unique: true,
    },
  ]);
