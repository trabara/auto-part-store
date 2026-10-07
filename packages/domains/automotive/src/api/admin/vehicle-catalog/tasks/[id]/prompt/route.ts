// What a leased task's model should be asked: the catalog's side and the
// evidence (pages read through the gateway, condensed), with the JSON schema of
// the answer; or { fallback: "agent" } when no evidence was found.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { buildPrompt } from "@repo/module-vehicle/core";
import { stewardEvidence } from "../../../../../../queries/steward-evidence";
import { webResearch } from "../../../../../../queries/web-research";
import { vehicleService } from "../../../../../request";
import type { AdminStewardLeaseBody } from "../../../../validators";

export async function POST(req: MedusaRequest<AdminStewardLeaseBody>, res: MedusaResponse) {
  const service = vehicleService(req);
  const task = await service.leasedTask(req.params.id!, req.validatedBody.lease_token);
  const { context, urls } = await service.taskContext(task.id);
  const { evidence, credits } = await stewardEvidence(webResearch(req.scope), context, urls);
  await service.noteTaskUsage(task.id, { urls: evidence.map((e) => e.url), credits });
  if (!evidence.length) {
    res.json({ kind: task.kind, fallback: "agent", reason: "no readable source found" });
    return;
  }
  res.json({ kind: task.kind, ...buildPrompt(context, evidence), urls: evidence.map((e) => e.url) });
}
