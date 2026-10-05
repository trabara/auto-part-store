import { defineModule } from "@repo/framework/core";
import { Fitment, FitmentPosition } from "../../modules/fitment/entities";
import {
  Vehicle,
  VehicleEngine,
  VehicleMake,
  VehicleModel,
} from "../../modules/vehicle/entities";

// Features must match the entities exposed by the generic API
// (api/admin/automotive/entities.ts).
export default defineModule({
  name: "Automotive",
  path: "automotive",
  features: (m) => ({
    vehicle: m.crud(Vehicle, {
      steps: [
        {
          id: "general",
          label: "General",
          fields: ["model_id", "engine_id", "year_start", "year_end"],
        },
        {
          id: "specs",
          label: "Specifications",
          fields: ["body_style", "doors", "drive", "transmission"],
        },
      ],
    }),
    vehicle_engine: m.crud(VehicleEngine),
    vehicle_make: m.crud(VehicleMake),
    vehicle_model: m.crud(VehicleModel),
    fitment: m.crud(Fitment, {
      relations: { conditionGroups: { hidden: true } },
    }),
    fitment_position: m.crud(FitmentPosition),
  }),
});
