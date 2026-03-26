import { model } from "@medusajs/framework/utils";

export const RbacPermission = model
  .define("rbac_permission", {
    id: model.id().primaryKey(),
    kind: model.enum(["read", "write", "delete"]),
    target: model.text(),
    type: model.enum(["predefined", "custom"]).default("custom"),
    category_id: model.text().nullable(),
  })
  .indexes([
    {
      on: ["kind", "target"],
      unique: true,
    },
  ]);
