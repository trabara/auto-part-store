import { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { Fitment } from "./fitment";

export const FitmentEngine = model
  .define("fitment_engine", {
    id: model.id().primaryKey(),
    fuel: model.enum([
      "GASOLINE",
      "DIESEL",
      "ELECTRIC",
      "HYBRID",
    ]).default("GASOLINE"),
    type: model.enum([
      "I4",
      "V4",
      "V6",
      "V8",
      "ELECTRIC",
      "HYBRID",
    ]).default("I4"),
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


export type Engine = InferTypeOf<typeof FitmentEngine>;