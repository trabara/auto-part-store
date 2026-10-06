// A fitment's condition tree: read and replace as one document.
// (A level below the generic /admin/fitments/:entity/:id routes.)
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FITMENT_MODULE, type FitmentModuleService } from "../../../../../../modules/fitment";
import { summarizeConditions, type ConditionGroupInput } from "../../../../../../modules/fitment/conditions";
import { replaceFitmentConditionsWorkflow } from "../../../../../../workflows/replace-fitment-conditions";

const fitments = (req: MedusaRequest) => req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tree = await fitments(req).getConditionTree(req.params.id!);
  res.json({ tree, summary: summarizeConditions(tree) });
}

export async function PUT(req: MedusaRequest<{ tree: ConditionGroupInput | null }>, res: MedusaResponse) {
  await replaceFitmentConditionsWorkflow(req.scope).run({
    input: { fitment_id: req.params.id!, tree: req.validatedBody.tree },
  });
  const tree = await fitments(req).getConditionTree(req.params.id!);
  res.json({ tree, summary: summarizeConditions(tree) });
}
