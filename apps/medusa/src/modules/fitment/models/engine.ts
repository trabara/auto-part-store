import { model } from "@medusajs/framework/utils"
import { EngineTypeSchema, FuelTypeSchema } from "../schema"
import { Fitment } from "./fitment"

export const Engine = model.define("fitment_engine", {
  id: model.id().primaryKey(),
  fuel: model.enum(FuelTypeSchema.Values).default("gasoline"),
  type: model.enum(EngineTypeSchema.Values).default("I4"),
  size: model.text().default("1.0"),
  tech: model.text().nullable(),
  fitments: model.hasMany(() => Fitment, {
    mappedBy: "engine",
  }),
})
