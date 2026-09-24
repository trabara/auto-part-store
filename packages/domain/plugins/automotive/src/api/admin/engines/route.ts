import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  type FitmentModuleService,
} from "../../../modules/fitment";
import {
  CreateEngineInput,
  UpdateEngineBatchInput,
} from "../../../modules/fitment/validations";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(
    `Fetching engines list ${JSON.stringify({
      filters: req.filterableFields,
      config: req.queryConfig,
    })}`,
  );

  const { data: engines, metadata } = await query.graph({
    entity: "fitment_engine",
    ...req.queryConfig,
    ...req.filterableFields,
  });

  logger.info(`Found ${engines.length} engines`);

  res.status(200).json({ data: engines, metadata });
};

export const POST = async (
  req: MedusaRequest<CreateEngineInput>,
  res: MedusaResponse,
) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

  logger.info(
    `Creating new engine ${JSON.stringify({ data: req.validatedBody })}) `,
  );

  const [engine] = await service.createFitmentEngines([req.validatedBody]);

  logger.info(`Created engine with ID: ${engine.id}`);

  res.status(201).json({ engine });
};

export const PATCH = async (
  req: MedusaRequest<UpdateEngineBatchInput>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { engines } = req.validatedBody;

  logger.info(`Batch updating ${engines.length} engines`);

  const updatedEngines = await service.updateFitmentEngines(engines);

  logger.info(`Batch updated ${engines.length} engines`);

  res.status(200).json({ engines: updatedEngines });
};
