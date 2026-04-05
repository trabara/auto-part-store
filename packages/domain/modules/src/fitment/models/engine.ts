import { model } from "@medusajs/framework/utils";
import { EngineTypeSchema, FuelTypeSchema } from "@trabara/core/schemas";
import { Fitment } from "./fitment";
import { InferTypeOf } from "@medusajs/framework/types";

export const FitmentEngine = model
  .define("fitment_engine", {
    id: model.id().primaryKey(),
    fuel: model.enum(FuelTypeSchema.Values).default("GASOLINE"),
    type: model.enum(EngineTypeSchema.Values).default("I4"),
    size: model.text().default("1.0"),
    tech: model.text().nullable(),
    fitments: model.hasMany(() => Fitment, {
      mappedBy: "engine",
    }),
  })
  .indexes([
    {
      name: "fitment_engine_unique",
      on: ["fuel", "type", "size", "tech"],
      unique: true,
    },
  ]);


export type FitmentEngine = InferTypeOf<typeof FitmentEngine>;