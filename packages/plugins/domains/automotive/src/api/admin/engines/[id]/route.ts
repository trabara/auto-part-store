import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  UpdateEngineInput,
  type FitmentModuleService,
} from "../../../../modules/fitment";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(`Fetching engine with ID: ${id}`);

  const { data } = await query.graph(
    {
      entity: "fitment_engine",
      fields: [
        "id",
        "fuel",
        "type",
        "size",
        "tech",
        "created_at",
        "updated_at",
        "fitments.*",
      ],
      filters: { id },
    },
    {
      throwIfKeyNotFound: true,
    },
  );

  if (!data || data.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Engine not found");
  }

  logger.info(`Found engine with ID: ${id}`);

  res.status(200).json({ engine: data[0] });
};

export const PATCH = async (
  req: MedusaRequest<UpdateEngineInput>,
  res: MedusaResponse,
) => {
  const { id } = req.params;
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(
    `Updating engine with ID: ${id} ${JSON.stringify({ data: req.validatedBody })}`,
  );

  const [engine] = await service.updateFitmentEngines([
    { ...req.validatedBody, id },
  ]);

  logger.info(`Updated engine with ID: ${id}`);

  res.status(200).json({ engine });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { id } = req.params;

  logger.info(`Deleting engine with ID: ${id}`);

  await service.deleteFitmentEngines([id]);

  logger.info(`Deleted engine with ID: ${id}`);
  res.status(200).json({ id, deleted: true, object: "engine" });
};
