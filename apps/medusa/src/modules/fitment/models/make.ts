import { model } from "@medusajs/framework/utils"
import { Model } from "./model"

export const Make = model.define("fitment_make", {
  id: model.id().primaryKey(),
  name: model.text(),
  models: model.hasMany(() => Model, {
    mappedBy: "make",
  }),
})
