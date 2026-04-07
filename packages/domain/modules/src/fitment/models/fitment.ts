import { model } from "@medusajs/framework/utils";
import {
  BodyStyleTypeSchema,
  DriveTypeSchema,
  TransmissionTypeSchema,
} from "@trabara/core/schemas";
import { Engine } from "./engine";
import { Model } from "./model";
import { InferTypeOf } from "@medusajs/framework/types";

export const Fitment = model
  .define("fitment", {
    id: model.id().primaryKey(),
    body_style: model.enum(BodyStyleTypeSchema.Values).default("SEDAN"),
    doors: model.number().default(4),
    drive: model.enum(DriveTypeSchema.Values).default("FWD"),
    transmission: model.enum(TransmissionTypeSchema.Values).default("MANUAL"),
    year_start: model.number(),
    year_end: model.number().nullable(),
    model: model.belongsTo(() => Model, {
      mappedBy: "fitments",
    }),
    engine: model.belongsTo(() => Engine, {
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