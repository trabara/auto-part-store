import { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils";
import { FitmentEngine } from "./engine";
import { FitmentModel } from "./model";

export const Fitment = model
  .define("fitment", {
    id: model.id().primaryKey(),
    body_style: model.enum([
      "SEDAN",
      "SUV",
      "HATCHBACK",
      "COUPE",
      "CONVERTIBLE",
      "WAGON",
      "VAN",
      "PICKUP",
    ]).default("SEDAN"),
    doors: model.number().default(4),
    drive: model.enum(["FWD", "RWD", "AWD", "FOUR_WD"]).default("FWD"),
    transmission: model.enum(["MANUAL", "AUTOMATIC", "CVT", "DUAL_CLUTCH"]).default("MANUAL"),
    year_start: model.number(),
    year_end: model.number().nullable(),
    model: model.belongsTo(() => FitmentModel, {
      mappedBy: "fitments",
    }),
    engine: model.belongsTo(() => FitmentEngine, {
      mappedBy: "fitments",
    }),
  })
  .indexes([
    {
      on: [
        "model_id",
        "engine_id",
        "body_style",
        "doors",
        "drive",
        "transmission",
        "year_start",
        "year_end",
      ],
      unique: true,
    },
  ])
  .checks([
    {
      name: "year_range_check",
      expression: "year_end IS NULL OR year_end >= year_start",
    },
  ]);

export type Fitment = InferTypeOf<typeof Fitment>;