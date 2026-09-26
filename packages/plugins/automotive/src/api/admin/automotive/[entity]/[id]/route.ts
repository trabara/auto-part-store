import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { camelCase, lowerCase, snakeCase, startCase, upperFirst } from "lodash";
import { FITMENT_MODULE, type FitmentModuleService } from "~/modules/fitment";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const entity = snakeCase(lowerCase(req.params.entity));

  logger.info(`Fetching ${entity} with ID: ${id}`);

  const { data } = await query.graph(
    {
      entity,
      ...req.queryConfig,
      filters: { id },
    },
    {
      throwIfKeyNotFound: true,
    },
  );

  if (!data || data.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `${entity} not found`);
  }

  logger.info(`Found ${entity} with ID: ${id}`);

  res.status(200).json({ entity, data: data[0] });
};

export const PUT = async (req: MedusaRequest<any>, res: MedusaResponse) => {
  const { id } = req.params;
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const entity = snakeCase(lowerCase(req.params.entity));

  logger.info(
    `Updating ${entity} with ID: ${id} ${JSON.stringify(req.validatedBody)}`,
  );

  const [result] = await service[`update${upperFirst(camelCase(entity))}s`]([
    { ...req.validatedBody, id },
  ]);

  logger.info(`Updated ${entity} with ID: ${id}`);

  res.status(200).json({ data: result });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { id } = req.params;

  const entity = snakeCase(lowerCase(req.params.entity));

  logger.info(`Deleting ${entity} with ID: ${id}`);

  await service[`delete${upperFirst(camelCase(entity))}s`]([id]);

  logger.info(`Deleted engine with ID: ${id}`);
  res.status(200).json({ id, deleted: true });
};
