import { model } from "@medusajs/framework/utils"
import { FitmentMake } from "./make"
import { Fitment } from "./fitment"
import { InferTypeOf } from "@medusajs/framework/types";

export const FitmentModel = model.define("fitment_model", {
  id: model.id().primaryKey(),
  name: model.text(),
  make: model.belongsTo(() => FitmentMake, {
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

export type FitmentModel = InferTypeOf<typeof FitmentModel>;