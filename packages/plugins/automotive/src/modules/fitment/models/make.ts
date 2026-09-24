import { DmlEntity } from "@medusajs/framework/utils";
import { createModel, InferDmlSchema, ref } from "@repo/orm";
import { VehicleMakeSchema } from "../schemas/make";
import { VehicleModelEntity } from "./model";

export type MakeEntity = DmlEntity<
  InferDmlSchema<typeof VehicleMakeSchema>,
  string
>;

export const VehicleMake: MakeEntity = createModel(
  "VehicleMake",
  VehicleMakeSchema,
  {
    relationships: {
      models: {
        kind: "hasMany",
        model: ref<VehicleModelEntity>("VehicleModel"),
        options: { mappedBy: "make" },
      },
    },
    indexes: [
      {
        name: "vehicle_make_name_unique",
        on: ["name"],
        unique: true,
      },
    ],
  },
);
