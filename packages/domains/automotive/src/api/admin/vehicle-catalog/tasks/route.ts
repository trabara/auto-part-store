// The research queue, one focused task each: a model's generations, or one
// generation's configurations (with those already in the catalog).
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { vehicleService } from "../../../request";
import type { AdminCatalogTasksParams } from "../../validators";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { make, max_configurations, limit, offset } = req.validatedQuery as AdminCatalogTasksParams;
  const { tasks, count } = await vehicleService(req).catalogResearchTasks({ make, maxConfigurations: max_configurations, limit, offset });
  res.json({ tasks, count, limit, offset });
}
