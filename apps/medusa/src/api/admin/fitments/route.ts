import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  CreateFitmentInput,
  UpdateFitmentInput,
} from "../../../modules/fitment/schema";
import { FITMENT_MODULE } from "../../../modules/fitment";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data, metadata } = await query.graph({
    entity: "fitment",
    ...req.queryConfig,
    ...req.filterableFields,
  });

  res.json({ fitments: data, metadata });
}

export async function POST(
  req: MedusaRequest<CreateFitmentInput>,
  res: MedusaResponse,
) {
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);
  const fitment = await fitmentModuleService.createFullFitment(
    req.validatedBody,
  );
  res.json({ fitment });
}

export async function PATCH(
  req: MedusaRequest<UpdateFitmentInput>,
  res: MedusaResponse,
) {
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);
  const updated = await fitmentModuleService.updateFullFitment(
    req.validatedBody,
  );
  res.status(200).json({ fitment: updated });
}
