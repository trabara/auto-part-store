import { model } from "@medusajs/framework/utils"
import { FitmentModel } from "./model"
import { InferTypeOf } from "@medusajs/framework/types";

export const FitmentMake = model.define("fitment_make", {
  id: model.id().primaryKey(),
  name: model.text(),
  models: model.hasMany(() => FitmentModel, {
    mappedBy: "make",
  }),
}).indexes([
  {
    name: "fitment_make_name_unique",
    on: ["name"],
    unique: true,
  }
])

export type FitmentMake = InferTypeOf<typeof FitmentMake>;