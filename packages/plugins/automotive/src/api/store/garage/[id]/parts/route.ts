// Parts fitting one of the customer's garage vehicles (its build date narrows windows).
import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { partsForVehicle } from "../../../../../queries/parts-for-vehicle";
import type { StorePartsParams } from "../../../automotive/validators";
import { ownGarageVehicle, vehicleService } from "../../helpers";

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const garage = await ownGarageVehicle(req, req.params.id!);
  const vehicle = await vehicleService(req).vehicleSummary(garage.vehicle_id);
  const build = garage.build_year ? { year: garage.build_year, month: garage.build_month } : undefined;
  res.json({
    garage_vehicle: garage,
    vehicle,
    ...(await partsForVehicle(req as any, vehicle.id, req.validatedQuery as StorePartsParams, build)),
  });
}
