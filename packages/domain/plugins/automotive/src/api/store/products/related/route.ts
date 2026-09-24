import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ProductService } from "../../../../modules/fitment/services";

export const GET = async (
  req: MedusaRequest<
    unknown,
    {
      product_id: string;
      currency_code: string;
      region_id: string;
      fitment_id?: string;
    }
  >,
  res: MedusaResponse,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const service = new ProductService(query);

  const { product_id, currency_code, region_id, fitment_id } =
    req.filterableFields;

  logger.info(`Fetching related products for product ${product_id}`);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "categories.id"],
    filters: { id: product_id },
  });

  const category_id: string | undefined = products?.[0]?.categories?.[0]?.id;

  const result = await service.list({
    region_id,
    currency_code,
    fitment_id,
    category_id,
    exclude_id: product_id,
    queryConfig: req.queryConfig,
  });

  res.status(200).json(result);
};
