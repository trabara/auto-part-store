import { defineLink } from "@medusajs/framework/utils";
import FitmentModule from "@repo/module-fitment";
import VehicleModule from "@repo/module-vehicle";

// fitment.vehicle_id → vehicle, readable as `fitment.vehicle` in query.graph.
// Matches `vehicle: r.link("Vehicle", { storage: "column" })` on Fitment.
export default defineLink(
  { linkable: FitmentModule.linkable.fitment, field: "vehicle_id" },
  VehicleModule.linkable.vehicle,
  { readOnly: true },
);
