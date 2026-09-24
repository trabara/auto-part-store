import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  ProductListInput,
  ProductService,
} from "../../../../modules/fitment/services";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  logger.info(`Listing products with filters {JSON.stringify({
    filters: req.filterableFields,
    queryConfig: req.queryConfig,
  })}`);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const service = new ProductService(query);

  const result = await service.list({
    ...(req.filterableFields as ProductListInput),
    queryConfig: req.queryConfig,
  });
  
  res.status(200).json(result);
};
