// Admin definition of the vehicle module (`/app/vehicles/...`). Isomorphic:
// no UI code here (tests and the server load module definitions too).
import { defineModule } from "@repo/framework/core";
import {
  CustomerVehicle,
  Vehicle,
  VehicleEngine,
  VehicleGeneration,
  VehicleMake,
  VehicleModel,
  VehicleReference,
} from "../entities";

// Features match the entities of the module's API (../http.ts).
export default defineModule({
  name: "Vehicles",
  path: "vehicles",
  features: (m) => ({
    vehicle: m.crud(Vehicle, {
      path: "configurations",
      steps: [
        {
          id: "general",
          label: "General",
          fields: ["generation_id", "engine_id", "trim", "year_start", "year_end"],
        },
        {
          id: "specs",
          label: "Specifications",
          fields: ["body_style", "doors", "drive", "transmission"],
        },
      ],
    }),
    vehicle_make: m.crud(VehicleMake, { path: "makes" }),
    vehicle_model: m.crud(VehicleModel, { path: "models" }),
    vehicle_generation: m.crud(VehicleGeneration, { path: "generations" }),
    vehicle_engine: m.crud(VehicleEngine, { path: "engines" }),
    vehicle_reference: m.crud(VehicleReference, { path: "references", label: "Catalog IDs" }),
    customer_vehicle: m.crud(CustomerVehicle, { path: "garage", label: "Garage" }),
  }),
});
