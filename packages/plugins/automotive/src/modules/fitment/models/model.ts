import { InferEntityType } from "@medusajs/framework/types";
import { DmlEntity } from "@medusajs/framework/utils";
import { createModel, InferDmlSchema, ref } from "@repo/orm";
import { VehicleModelSchema } from "../schemas/model";
import { MakeEntity } from "./make";
import { VehicleEntity } from "./vehicle";

type VehicleModelRels = {
  make: { kind: "belongsTo"; model: () => MakeEntity };
  vehicles: { kind: "hasMany"; model: () => VehicleEntity };
};

export type VehicleModelEntity = DmlEntity<
  InferDmlSchema<
    typeof VehicleModelSchema,
    Record<string, never>,
    VehicleModelRels
  >,
  string
>;

export type VehicleModelDml = InferEntityType<VehicleModelEntity>;

export const VehicleModel: VehicleModelEntity = createModel(
  "VehicleModel",
  VehicleModelSchema,
  {
    relationships: {
      make: {
        kind: "belongsTo",
        model: ref<MakeEntity>("VehicleMake"),
        options: { mappedBy: "models" },
      },
      vehicles: {
        kind: "hasMany",
        model: ref<VehicleEntity>("Vehicle"),
        options: { mappedBy: "model" },
      },
    },
    indexes: [
      {
        name: "vehicle_model_name_unique",
        on: ["name"],
        unique: true,
      },
    ],
  },
);
