import { defineLink } from "@medusajs/framework/utils";
import GarageModule from "@repo/module-garage";
import VehicleModule from "@repo/module-vehicle";

// customer_vehicle.vehicle_id → vehicle, readable as `customer_vehicle.vehicle`
// in query.graph. Matches `vehicle: r.link("Vehicle", { storage: "column" })`
// on CustomerVehicle.
export default defineLink(
  { linkable: GarageModule.linkable.customerVehicle, field: "vehicle_id" },
  VehicleModule.linkable.vehicle,
  { readOnly: true },
);
