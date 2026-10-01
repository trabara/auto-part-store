import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { camelCase, lowerCase, snakeCase, startCase, upperFirst } from "lodash";
import { AUTOMOTIVE_MODULE, type AutomotiveModuleService } from "~/modules/automotive";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const entity = snakeCase(req.params.entity);

  logger.info(
    `Fetching ${entity}s list ${JSON.stringify({
      filters: req.filterableFields,
      config: req.queryConfig,
    })}`,
  );

  const { data, metadata } = await query.graph({
    entity,
    ...req.queryConfig,
    ...req.filterableFields,
  });

  logger.info(`Found ${data.length} ${entity}s`);

  res.status(200).json({ entity, data, metadata });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const service = req.scope.resolve<AutomotiveModuleService>(AUTOMOTIVE_MODULE);

  const entity = snakeCase(lowerCase(req.params.entity));

  logger.info(
    `Creating new ${entity} as ${JSON.stringify(req.validatedBody, null, 2)})`,
  );

  const [result] = await service[`create${upperFirst(camelCase(entity))}s`]([
    req.validatedBody,
  ]);

  logger.info(`Created engine with ID: ${result.id}`);

  res.status(201).json({ entity, data: result });
};

export const PUT = async (
  req: MedusaRequest<{ entities: any[] }>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<AutomotiveModuleService>(AUTOMOTIVE_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { entities } = req.validatedBody;

  const entity = snakeCase(req.params.entity);

  logger.info(`Batch updating ${entities.length} ${entity}s`);

  const updatedEngines =
    await service[`update${upperFirst(camelCase(entity))}s`](entities);

  logger.info(`Batch updated ${entities.length} engines`);

  res.status(200).json({ entity: entity, updates: updatedEngines });
};
