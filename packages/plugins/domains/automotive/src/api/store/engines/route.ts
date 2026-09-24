import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

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
