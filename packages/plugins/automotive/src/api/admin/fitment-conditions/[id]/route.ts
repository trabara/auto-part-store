// A fitment's condition tree: read and replace as one document.
// (Outside /admin/automotive: the generic /:entity/:id routes own that space.)
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { FITMENT_MODULE } from "../../../../modules/fitment";
import { summarizeConditions, validateTree, type ConditionGroupInput } from "../../../../modules/fitment/conditions";
import { loadConditionTree, replaceFitmentConditionsWorkflow } from "../../../../workflows/replace-fitment-conditions";

async function fitmentOr404(req: MedusaRequest, id: string) {
  const [fitment] = await req.scope.resolve<any>(FITMENT_MODULE).listFitments({ id }, { select: ["id"] });
  if (!fitment) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Fitment "${id}" not found`);
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await fitmentOr404(req, req.params.id!);
  const tree = await loadConditionTree(req.scope as any, req.params.id!);
  res.json({ tree, summary: summarizeConditions(tree) });
}

export async function PUT(req: MedusaRequest<{ tree: ConditionGroupInput | null }>, res: MedusaResponse) {
  await fitmentOr404(req, req.params.id!);
  const { tree } = req.validatedBody;
  const errors = tree ? validateTree(tree) : [];
  if (errors.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, errors.join(" "));
  await replaceFitmentConditionsWorkflow(req.scope).run({ input: { fitment_id: req.params.id!, tree } });
  const saved = await loadConditionTree(req.scope as any, req.params.id!);
  res.json({ tree: saved, summary: summarizeConditions(saved) });
}
