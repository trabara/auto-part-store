import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  type FitmentModuleService,
} from "../../../modules/fitment";
import { CreateVehicleInput } from "../../../modules/fitment/dto";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(
    `Fetching fitments list ${JSON.stringify({
      filters: req.filterableFields,
      config: req.queryConfig,
    })}`,
  );

  const { data, metadata } = await query.graph({
    entity: "fitment",
    ...req.queryConfig,
    ...req.filterableFields,
  });

  logger.info(`Found ${data.length} fitments`);

  res.status(200).json({ data, metadata });
};

export const POST = async (
  req: MedusaRequest<CreateVehicleInput>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(
    `Creating new vehicle: ${JSON.stringify({ data: req.validatedBody })}`,
  );

  const [vehicle] = await service.createVehicles([req.validatedBody]);

  logger.info(`Vehicle created successfully: ${vehicle.id}`);

  res.status(201).json({ vehicle });
};
