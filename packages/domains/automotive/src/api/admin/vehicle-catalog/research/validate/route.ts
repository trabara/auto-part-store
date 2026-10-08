// The research agent's check before it answers: its draft against the catalog,
// without writing (a dry-run merge). A draft that doesn't parse comes back as
// problems to fix, not as an error, so the agent can correct it.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { agentDraftFile } from "@repo/module-vehicle/core";
import { vehicleService } from "../../../../request";
import type { AdminResearchValidateBody } from "../../../validators";

export async function POST(req: MedusaRequest<AdminResearchValidateBody>, res: MedusaResponse) {
  const { task_id, answer } = req.validatedBody;
  const task = await vehicleService(req).retrieveCatalogTask(task_id, { select: ["make", "model"] });
  const draft = agentDraftFile(answer ?? "", { make: task.make ?? "", model: task.model ?? "" });
  if ("empty" in draft) return res.json({ problems: [], note: "No generations to check: answering with none (and the reason in notes) is valid." });
  if ("problems" in draft) return res.json({ problems: draft.problems });
  res.json({ report: await vehicleService(req).importCatalog(draft.file, { dryRun: true, mode: "merge" }) });
}
