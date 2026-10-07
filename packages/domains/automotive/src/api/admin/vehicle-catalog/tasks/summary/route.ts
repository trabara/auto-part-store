// What the steward did since a time (a night's run): outcomes, spend, reviews waiting.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { vehicleService } from "../../../../request";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const since = new Date(String(req.query.since ?? ""));
  if (Number.isNaN(since.getTime())) throw new MedusaError(MedusaError.Types.INVALID_DATA, "since: an ISO date is required");
  res.json(await vehicleService(req).taskSummary(since));
}
