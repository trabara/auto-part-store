// Web results with their most relevant passages (Tavily, cached); credits go on the task.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { webResearch } from "../../../../../queries/web-research";
import { vehicleService } from "../../../../request";
import type { AdminResearchSearchBody } from "../../../validators";

export async function POST(req: MedusaRequest<AdminResearchSearchBody>, res: MedusaResponse) {
  const { query, task_id } = req.validatedBody;
  const result = await webResearch(req.scope).webSearch(query);
  if (task_id && result.credits) await vehicleService(req).noteTaskUsage(task_id, { credits: result.credits });
  res.json(result);
}
