import { DmlEntity } from "@medusajs/framework/utils";
import { createModel, InferDmlSchema, ref } from "@repo/orm";
import { VehicleSchema } from "../schemas/vehicle";
import { VehicleEngineEntity } from "./engine";
import { VehicleModelEntity } from "./model";

type VehicleRels = {
  model: { kind: "belongsTo"; model: () => VehicleModelEntity };
  engine: { kind: "belongsTo"; model: () => VehicleEngineEntity };
};

export type VehicleEntity = DmlEntity<
  InferDmlSchema<
    typeof VehicleSchema,
    // { model: "model_id"; engine: "engine_id" },
    Record<string, never>,
    VehicleRels
  >,
  string
>;

export const Vehicle: VehicleEntity = createModel("Vehicle", VehicleSchema, {
  // flatRelations: {
  //   model: "model_id",
  //   engine: "engine_id",
  // },
  relationships: {
    engine: {
      kind: "belongsTo",
      model: ref<VehicleEngineEntity>("VehicleEngine"),
      options: { mappedBy: "vehicles" },
    },
    model: {
      kind: "belongsTo",
      model: ref<VehicleModelEntity>("VehicleModel"),
      options: { mappedBy: "vehicles" },
    },
  },
  indexes: [
    {
      unique: true,
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
    },
  ],
  checks: [
    {
      name: "year_range_check",
      expression: "year_end IS NULL OR year_end >= year_start",
    },
  ],
});
