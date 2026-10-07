import type { MedusaStoreRequest } from "@medusajs/framework/http";
import { type BuildDate } from "./fitment-search";
import type { StorePartsParams } from "../api/store/validators";
/**
 * Products fitting a vehicle (optionally built at `build`), each variant with
 * its fitments; condition summaries in the request's locale (`?locale=`,
 * `x-medusa-locale`), else English.
 */
export declare function partsForVehicle(req: MedusaStoreRequest<unknown>, vehicleId: string, params: StorePartsParams, build?: BuildDate): Promise<{
    limit: number;
    offset: number;
    products: any[];
    count: number;
}>;
