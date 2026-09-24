import { InferEntityType } from "@medusajs/framework/types";
import { DmlEntity } from "@medusajs/framework/utils";
import { createModel, InferDmlSchema, ref } from "@repo/orm";
import { VehicleEngineSchema } from "../schemas/engine";
import { VehicleEntity } from "./vehicle";

export type VehicleEngineEntity = DmlEntity<
  InferDmlSchema<typeof VehicleEngineSchema>,
  string
>;

export type VehicleEngineDml = InferEntityType<VehicleEngineEntity>;

export const VehicleEngine: VehicleEngineEntity = createModel(
  "VehicleEngine",
  VehicleEngineSchema,
  {
    relationships: {
      vehicles: {
        kind: "hasMany",
        model: ref<VehicleEntity>("Vehicle"),
        options: { mappedBy: "engine" },
      },
    },
    indexes: [
      {
        name: "vehicle_engine_unique",
        on: ["fuel", "type", "size", "power"],
        unique: true,
      },
    ],
  },
);
