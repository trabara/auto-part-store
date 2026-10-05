import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { AUTOMOTIVE_MODULE, type AutomotiveModuleService } from "~/modules/automotive";
import { resolveEntity } from "../../entities";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { key: entity } = resolveEntity(req.params.entity);

  const { data } = await query.graph({
    entity,
    ...req.queryConfig,
    filters: { id },
  });

  if (!data?.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `${entity} with id "${id}" not found`,
    );
  }

  res.status(200).json({ entity, data: data[0] });
};

export const PUT = async (
  req: MedusaRequest<Record<string, unknown>>,
  res: MedusaResponse,
) => {
  const { id } = req.params;
  const service = req.scope.resolve<AutomotiveModuleService>(AUTOMOTIVE_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const { key: entity, plural } = resolveEntity(req.params.entity);

  const [result] = await service[`update${plural}`]([
    { ...req.validatedBody, id },
  ]);

  logger.info(`Updated ${entity} ${id}`);

  res.status(200).json({ entity, data: result });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const service = req.scope.resolve<AutomotiveModuleService>(AUTOMOTIVE_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const { key: entity, plural } = resolveEntity(req.params.entity);

  await service[`delete${plural}`]([id]);

  logger.info(`Deleted ${entity} ${id}`);

  res.status(200).json({ id, object: entity, deleted: true });
};
