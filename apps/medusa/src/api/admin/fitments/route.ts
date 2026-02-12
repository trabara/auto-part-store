import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createFitmentWorkflow } from "../../../workflows/create-fitment";
import { CreateFitmentInput } from "../../../modules/fitment/schema";

export async function POST(
  req: MedusaRequest<CreateFitmentInput>,
  res: MedusaResponse
) {

  const { result: { fitment } } = await createFitmentWorkflow(req.scope)
    .run({
      input: {
        ...req.validatedBody,
      }
    })

  res.json({ fitment })
}
