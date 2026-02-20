import { ProductFitmentsController } from "@/modules/fitment/controllers/product-fitments";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * GET /admin/fitments/:id/products
 * Get all products linked to a fitment
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ProductFitmentsController(req, res);
  await controller.getProductsForFitment();
}

/**
 * POST /admin/fitments/:id/products
 * Link multiple products to a fitment
 */
export async function POST(
  req: MedusaRequest<{ product_ids: string[] }>,
  res: MedusaResponse,
) {
  const controller = new ProductFitmentsController(req, res);
  await controller.linkProductsToFitment();
}
