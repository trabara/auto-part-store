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
      relations: {
        variant: { label: "Part" },
        conditionGroups: { hidden: true },
      },
      steps: [
        {
          id: "application",
          label: "Application",
          fields: ["variant_id", "vehicle_id", "position_id", "quantity"],
        },
        {
          id: "production",
          label: "Production window",
          description: "Leave empty when the part fits the vehicle's whole production range.",
          fields: ["from_year", "from_month", "to_year", "to_month", "notes"],
        },
      ],
    }),
    fitment_position: m.crud(FitmentPosition),
  }),
});
