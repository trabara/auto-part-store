import { model } from "@medusajs/framework/utils"
import { Make } from "./make"
import { Fitment } from "./fitment"

export const Model = model.define("fitment_model", {
  id: model.id().primaryKey(),
  name: model.text(),
  make: model.belongsTo(() => Make, {
    mappedBy: "models",
  }),
  fitments: model.hasMany(() => Fitment, {
    mappedBy: "model",
  }),
})
