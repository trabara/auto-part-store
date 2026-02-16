import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  CreateEngineInput,
  UpdateEngineInput,
} from "../../../modules/fitment/schema";
import { FITMENT_MODULE } from "../../../modules/fitment";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: engines, metadata } = await query.graph({
    entity: "fitment_engine",
    ...req.queryConfig,
    ...req.filterableFields,
  });

  res.json({ engines, metadata });
};

export const POST = async (
  req: MedusaRequest<CreateEngineInput>,
  res: MedusaResponse,
) => {
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);
  const [engine] = await fitmentModuleService.createFitmentEngines([
    req.validatedBody,
  ]);

  res.status(201).json({ engine });
};

export const PATCH = async (
  req: MedusaRequest<{ engines: UpdateEngineInput[] }>,
  res: MedusaResponse,
) => {
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);
  const engines = await fitmentModuleService.updateFitmentEngines(
    req.validatedBody.engines,
  );

  res.status(200).json({ engines });
};
