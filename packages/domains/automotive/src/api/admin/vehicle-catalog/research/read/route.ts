// A page as markdown (free when possible, cached), condensed: around `focus`
// when given, else cut to the parts with specifications. Recorded on the task:
// its result's quotes are checked against what it read.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { condense } from "../../../../../core/condense";
import { webResearch } from "../../../../../queries/web-research";
import { vehicleService } from "../../../../request";
import type { AdminResearchReadBody } from "../../../validators";

export async function POST(req: MedusaRequest<AdminResearchReadBody>, res: MedusaResponse) {
  const { url, focus, task_id } = req.validatedBody;
  const page = await webResearch(req.scope).read(url);
  if (task_id) await vehicleService(req).noteTaskUsage(task_id, { urls: [url], credits: page.credits });
  const terms = focus ? focus.split(/[,\s]+/).filter((t) => t.length > 1) : [];
  res.json({ url, via: page.via, text: condense(page.text, { terms, budget: focus ? 8_000 : 20_000 }) });
}
