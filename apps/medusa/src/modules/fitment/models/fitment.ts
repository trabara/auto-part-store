import { model } from "@medusajs/framework/utils"
import { BodyStyleTypeSchema, DriveTypeSchema, TransmissionTypeSchema } from "../schema"
import { Model } from "./model"
import { Engine } from "./engine"

export const Fitment = model.define("fitment", {
  id: model.id().primaryKey(),
  body_style: model.enum(BodyStyleTypeSchema.Values).default("sedan"),
  drive: model.enum(DriveTypeSchema.Values).default("fwd"),
  transmission: model.enum(TransmissionTypeSchema.Values).default("manual"),
  year_start: model.number(),
  year_end: model.number(),
  model: model.belongsTo(() => Model, {
    mappedBy: "fitments",
  }),
  engine: model.belongsTo(() => Engine, {
    mappedBy: "fitments",
  }),
}).indexes([
  {
    on: ["model_id", "engine_id"],
    unique: true,
  },
]).checks([
  {
    name: "year_range_check",
    expression: "year_end >= year_start",
  },
])
