import type { MedusaStoreRequest } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { entityLabel } from "@repo/framework/entity";
import { fitmentSearch, type BuildDate } from "../../../lib/fitment-search";
import { storeProducts } from "../../../lib/store-products";
import { Vehicle } from "../../../modules/vehicle/entities";
import { graph } from "./selector";
import type { StorePartsParams } from "./validators";

/** The vehicle with its label, or 404. */
export async function vehicleOr404(req: MedusaStoreRequest<unknown>, id: string) {
  const [vehicle] = await graph(req, "vehicle", ["id", "year_start", "year_end", ...Vehicle.label.fields], { id });
  if (!vehicle) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Vehicle "${id}" not found`);
  return { id: vehicle.id, label: entityLabel(Vehicle, vehicle), year_start: vehicle.year_start, year_end: vehicle.year_end };
}

/** Products fitting a vehicle (optionally built at `build`), each variant with its fitments. */
export async function partsForVehicle(
  req: MedusaStoreRequest<unknown>,
  vehicleId: string,
  params: StorePartsParams,
  build?: BuildDate,
) {
  const fitting = await fitmentSearch(req.scope as any).fittingVariants(vehicleId, build);
  const { limit, offset, ...filters } = params;
  return storeProducts(req, [...fitting.keys()], filters, { limit, offset }, (variantId) => ({
    fitments: fitting.get(variantId) ?? [],
  }));
}
