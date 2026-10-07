// One make (optionally one model) as it is in the catalog, as a vehicle-catalog@1 file.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { vehicleService } from "../../../request";
import type { AdminCatalogExportParams } from "../../validators";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json(await vehicleService(req).exportCatalog(req.validatedQuery as AdminCatalogExportParams));
}
