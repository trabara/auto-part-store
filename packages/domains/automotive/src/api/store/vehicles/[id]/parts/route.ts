// Parts fitting a vehicle (optionally narrowed by build year / month).
import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { partsForVehicle } from "../../../../../queries/parts-for-vehicle";
import { vehicleService } from "../../../../request";
import type { StoreVehiclePartsParams } from "../../../validators";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  const { build_year, build_month, ...params } = req.validatedQuery as StoreVehiclePartsParams;
  const vehicle = await vehicleService(req).vehicleSummary(req.params.id!);
  const build = build_year ? { year: build_year, month: build_month } : undefined;
  res.json({ vehicle, ...(await partsForVehicle(req, vehicle.id, params, build)) });
}
