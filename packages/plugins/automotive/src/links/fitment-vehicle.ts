import { defineLink } from "@medusajs/framework/utils";
import FitmentModule from "../modules/fitment";
import VehicleModule from "../modules/vehicle";

// A fitment targets one vehicle; a vehicle has many fitments.
// Matches `vehicle: r.link("Vehicle")` on the Fitment entity.
export default defineLink(
  { linkable: FitmentModule.linkable.fitment, isList: true },
  VehicleModule.linkable.vehicle,
);
