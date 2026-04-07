import { model } from "@medusajs/framework/utils"
import { Make } from "./make"
import { Fitment } from "./fitment"
import { InferTypeOf } from "@medusajs/framework/types";

export const Model = model.define("fitment_model", {
  id: model.id().primaryKey(),
  name: model.text(),
  make: model.belongsTo(() => Make, {
    mappedBy: "models",
  }),
  fitments: model.hasMany(() => Fitment, {
    mappedBy: "model",
  }),
}).indexes([
  {
    name: "fitment_model_name_unique",
    on: ["name"],
    unique: true,
  }
])

export type Model = InferTypeOf<typeof Model>;