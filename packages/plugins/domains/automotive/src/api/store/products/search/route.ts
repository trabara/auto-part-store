import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ProductService } from "../../../../modules/fitment/services";

export const GET = async (
  req: MedusaRequest<
    unknown,
    {
      q: string;
      currency_code: string;
      region_id: string;
      fitment_id?: string;
      limit?: number;
    }
  >,
  res: MedusaResponse,
) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const service = new ProductService(query);

  const { q, currency_code, region_id, fitment_id } = req.filterableFields;

  logger.info(`Autocomplete search", ${q}`);

  const result = await service.list({
    q,
    fitment_id,
    region_id,
    currency_code,
    queryConfig: req.queryConfig,
  });

  res.status(200).json({ products: result.products });
};
