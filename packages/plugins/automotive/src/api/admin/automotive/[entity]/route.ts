import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { AUTOMOTIVE_MODULE, type AutomotiveModuleService } from "~/modules/automotive";
import { resolveEntity } from "../entities";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const { key: entity } = resolveEntity(req.params.entity);

  logger.debug(
    `Listing ${entity} ${JSON.stringify({ filters: req.filterableFields })}`,
  );

  const { data, metadata } = await query.graph({
    entity,
    ...req.queryConfig,
    filters: req.filterableFields,
  });

  res.status(200).json({ entity, data, metadata });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const service = req.scope.resolve<AutomotiveModuleService>(AUTOMOTIVE_MODULE);
  const { key: entity, plural } = resolveEntity(req.params.entity);

  const [result] = await service[`create${plural}`]([req.validatedBody]);

  logger.info(`Created ${entity} ${result.id}`);

  res.status(201).json({ entity, data: result });
};

export const PUT = async (
  req: MedusaRequest<{ entities: Record<string, unknown>[] }>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<AutomotiveModuleService>(AUTOMOTIVE_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const { key: entity, plural } = resolveEntity(req.params.entity);
  const { entities } = req.validatedBody;

  const updates = await service[`update${plural}`](entities);

  logger.info(`Batch updated ${entities.length} ${entity}`);

  res.status(200).json({ entity, updates });
};
