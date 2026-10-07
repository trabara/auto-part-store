// Brings the task ledger in line with the catalog (gaps to research, units due for verification).
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { vehicleService } from "../../../../request";
import type { AdminStewardRefreshBody } from "../../../validators";

export async function POST(req: MedusaRequest<AdminStewardRefreshBody>, res: MedusaResponse) {
  res.json(await vehicleService(req).refreshTasks({ maxConfigurations: req.validatedBody.max_configurations }));
}
