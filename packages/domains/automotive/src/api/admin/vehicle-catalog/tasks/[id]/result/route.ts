// A worker's result for a leased task: checked against the pages the task read
// (from the gateway's cache, not from the caller), applied by the steward's
// policy, and recorded with its cost and backoff.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { webResearch } from "../../../../../../queries/web-research";
import { vehicleService } from "../../../../../request";
import type { AdminStewardResultBody } from "../../../../validators";

export async function POST(req: MedusaRequest<AdminStewardResultBody>, res: MedusaResponse) {
  const service = vehicleService(req);
  const body = req.validatedBody;
  const task = await service.leasedTask(req.params.id!, body.lease_token);
  const research = webResearch(req.scope);
  const urls = [...new Set([...(task.sources ?? []), ...(body.sources ?? [])])];
  const evidence = (await Promise.all(urls.map(async (url) => ({ url, text: await research.cachedPage(url) })))).filter(
    (e): e is { url: string; text: string } => !!e.text,
  );
  res.json(await service.submitTaskResult(task.id, { ...body, evidence }));
}
