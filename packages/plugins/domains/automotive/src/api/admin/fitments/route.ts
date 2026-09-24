import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  type FitmentModuleService,
} from "../../../modules/fitment";
import { CreateFitmentInput } from "../../../modules/fitment/validations";

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
  req: MedusaRequest<CreateFitmentInput>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(
    `Creating new fitment: ${JSON.stringify({ data: req.validatedBody })}`,
  );

  const [fitment] = await service.createFitments([req.validatedBody]);

  logger.info(`Fitment created successfully: ${fitment.id}`);

  res.status(201).json({ fitment });
};
