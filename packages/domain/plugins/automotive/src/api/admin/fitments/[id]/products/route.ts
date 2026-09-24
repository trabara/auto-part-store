import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import FitmentProductLink from "../../../../../links/fitment-product";
import { FITMENT_MODULE } from "../../../../../modules/fitment";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: fitmentId } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(`Fetching products for fitment: ${fitmentId}`);

  const { data, metadata } = await query.graph({
    entity: FitmentProductLink.entryPoint,
    fields: ["product.*", "product.variants.*"],
    filters: { fitment_id: fitmentId },
  });

  const products = data.map((item) => item.product);

  logger.info(`Found ${products.length} products for fitment ${fitmentId}`);

  res.status(200).json({
    data: products,
    metadata,
  });
};

export const POST = async (
  req: MedusaRequest<{
    product_ids: string[];
  }>,
  res: MedusaResponse,
) => {
  const { id: fitmentId } = req.params;
  const { product_ids } = req.validatedBody;
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(`Linking ${product_ids.length} products to fitment ${fitmentId}`);

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);

  await Promise.all(
    product_ids.map((productId) =>
      link.create({
        [Modules.PRODUCT]: {
          product_id: productId,
        },
        [FITMENT_MODULE]: {
          fitment_id: fitmentId,
        },
      }),
    ),
  );

  logger.info(
    `Successfully linked ${product_ids.length} products to fitment ${fitmentId}`,
  );

  logger.info(`Products linked successfully to fitment ${fitmentId}`);
  res.status(200).json({
    message: "Products linked successfully",
    fitment_id: fitmentId,
    product_ids,
  });
};
