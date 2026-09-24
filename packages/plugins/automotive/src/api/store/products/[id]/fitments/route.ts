import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { success } from "@medusajs/framework/zod";
import {
  FITMENT_MODULE,
  type FitmentModuleService,
} from "../../../../../modules/fitment";
import FitmentProductLink from "../../../../../links/fitment-product";
/**
 * GET /store/products/:id/fitments
 * Get all fitments linked to a product (public store endpoint)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

  logger.info(`Fetching fitments for product: ${productId}`);

  // Use the link entry point to get the fitment IDs linked to this product
  const { data: linkRows, metadata } = await query.graph({
    entity: FitmentProductLink.entryPoint,
    fields: ["fitment_id"],
    filters: { product_id: productId },
  });

  const fitmentIds = linkRows.map((row: any) => row.fitment_id).filter(Boolean);

  if (!fitmentIds.length) {
    res.status(200).json({ data: [], metadata });
    return;
  }

  // Hydrate fitments with model + make + engine via the service
  const fitments = await service.listFitments(
    {
      id: { $in: fitmentIds },
    },
    {
      relations: ["model", "model.make", "engine"],
    },
  );

  logger.info(`Found ${fitments.length} fitments for product ${productId}`);

  res.status(200).json({ data: fitments, metadata });
}
