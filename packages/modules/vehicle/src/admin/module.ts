// Admin definition of the vehicle module (`/app/vehicles/...`). Isomorphic:
// no UI code here (tests and the server load module definitions too).
import { defineModule } from "@repo/framework/core";
import {
  CatalogTask,
  Vehicle,
  VehicleEngine,
  VehicleGeneration,
  VehicleMake,
  VehicleModel,
  VehicleReference,
} from "../contract";

// Provenance is server-managed: its JSON list of sources stays out of lists and
// detail attributes (the provenance section shows it); the trust tier stays visible.
const provenance = {
  sources: { hideLabel: true, isFiltrable: false, hideInDetails: true },
  verified_at: { hideLabel: true },
};
// A task's machine fields stay out of the list and the attributes (the review section shows them).
const taskInternals = Object.fromEntries(
  ["key", "record_id", "lease_until", "lease_token", "finding", "report", "proposal", "cost", "sources", "next_run_at", "last_run_at", "attempts"].map(
    (field) => [field, { hideLabel: true, isFiltrable: false, hideInDetails: !["next_run_at", "last_run_at", "attempts"].includes(field) }],
  ),
);

// Features match the entities of the module's API (../http.ts).
export default defineModule({
  name: "Vehicles",
  path: "vehicles",
  features: (m) => ({
    vehicle: m.crud(Vehicle, {
      path: "configurations",
      overrides: provenance,
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
    vehicle_make: m.crud(VehicleMake, { path: "makes", overrides: provenance }),
    vehicle_model: m.crud(VehicleModel, { path: "models", overrides: provenance }),
    vehicle_generation: m.crud(VehicleGeneration, { path: "generations", overrides: provenance }),
    vehicle_engine: m.crud(VehicleEngine, { path: "engines", overrides: provenance }),
    vehicle_reference: m.crud(VehicleReference, { path: "references", label: "Catalog IDs" }),
    catalog_task: m.crud(CatalogTask, { path: "research", label: "Research", overrides: taskInternals }),
  }),
});
