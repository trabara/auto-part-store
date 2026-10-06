import type { MedusaStoreRequest } from "@medusajs/framework/http";
import { fitmentSearch, type BuildDate } from "./fitment-search";
import { storeProducts } from "./store-products";
import type { StorePartsParams } from "../api/store/automotive/validators";

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
