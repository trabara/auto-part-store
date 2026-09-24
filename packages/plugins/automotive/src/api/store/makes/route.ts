import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info("Fetching makes list");

  const { data, metadata } = await query.graph({
    entity: "vehicle_make",
    ...req.queryConfig,
    ...req.filterableFields,
  });

  logger.info(`Found ${data.length} makes`);

  res.status(200).json({ data, metadata });
};
