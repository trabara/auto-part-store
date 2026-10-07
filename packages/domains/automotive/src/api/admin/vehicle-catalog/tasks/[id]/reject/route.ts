// Dismisses a proposal or finding, with the reviewer's feedback for the next run.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { vehicleService } from "../../../../../request";
import type { AdminStewardRejectBody } from "../../../../validators";

export async function POST(req: MedusaRequest<AdminStewardRejectBody>, res: MedusaResponse) {
  await vehicleService(req).rejectTask(req.params.id!, req.validatedBody.feedback ?? null);
  res.json({ id: req.params.id, status: "DONE" });
}
