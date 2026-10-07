// Imports a vehicle-catalog@1 file (`?dry_run=true` reports without writing;
// `?mode=create|fill|overwrite` decides what happens to existing values).
// Problems are part of the report: nothing is written when there are any.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { CatalogFile } from "@repo/module-vehicle/contract";
import { vehicleService } from "../../../request";
import type { AdminCatalogImportParams } from "../../validators";

export async function POST(req: MedusaRequest<CatalogFile>, res: MedusaResponse) {
  const { dry_run, mode } = req.validatedQuery as AdminCatalogImportParams;
  res.json({ report: await vehicleService(req).importCatalog(req.validatedBody, { dryRun: dry_run, mode }) });
}
