import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  CreateModelInput,
  UpdateModelInput,
} from "../../../modules/fitment/schema";
import { FITMENT_MODULE } from "../../../modules/fitment";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: models, metadata } = await query.graph({
    entity: "fitment_model",
    ...req.queryConfig,
    ...req.filterableFields,
  });

  res.json({ models, metadata });
};

export const POST = async (
  req: MedusaRequest<CreateModelInput>,
  res: MedusaResponse,
) => {
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);
  const model = await fitmentModuleService.createModelFromInput(
    req.validatedBody,
  );

  res.status(201).json({ model });
};

export const PATCH = async (
  req: MedusaRequest<{ models: UpdateModelInput[] }>,
  res: MedusaResponse,
) => {
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);
  const models = await fitmentModuleService.updateFitmentModels(
    req.validatedBody.models,
  );

  res.status(200).json({ models });
};
