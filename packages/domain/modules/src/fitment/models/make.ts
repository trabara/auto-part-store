import { model } from "@medusajs/framework/utils"
import { Model } from "./model"
import { InferTypeOf } from "@medusajs/framework/types";

export const Make = model.define("fitment_make", {
  id: model.id().primaryKey(),
  name: model.text(),
  models: model.hasMany(() => Model, {
    mappedBy: "make",
  }),
}).indexes([
  {
    name: "fitment_make_name_unique",
    on: ["name"],
    unique: true,
  }
])

export type Make = InferTypeOf<typeof Make>;