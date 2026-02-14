import { model } from "@medusajs/framework/utils"
import { BodyStyleTypeSchema, DriveTypeSchema, TransmissionTypeSchema } from "../schema"
import { FitmentEngine } from "./engine"
import { FitmentModel } from "./model"

export const Fitment = model.define("fitment", {
  id: model.id().primaryKey(),
  body_style: model.enum(BodyStyleTypeSchema.Values).default("SEDAN"),
  doors: model.number().default(4),
  drive: model.enum(DriveTypeSchema.Values).default("FWD"),
  transmission: model.enum(TransmissionTypeSchema.Values).default("MANUAL"),
  year_start: model.number(),
  year_end: model.number(),
  model: model.belongsTo(() => FitmentModel, {
    mappedBy: "fitments",
  }),
  engine: model.belongsTo(() => FitmentEngine, {
    mappedBy: "fitments",
  }),
}).indexes([
  {
    on: ["model_id", "engine_id", "body_style", "doors", "drive", "transmission", "year_start", "year_end"],
    unique: true,
  },
]).checks([
  {
    name: "year_range_check",
    expression: "year_end >= year_start",
  },
])
