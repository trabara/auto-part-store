import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ProductController } from "../../../../_controllers/product";

/**
 * GET /admin/products/:id/fitments
 * Get all fitments linked to a product
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ProductController(req, res);
  await controller.getFitmentsForProduct();
}

/**
 * POST /admin/products/:id/fitments
 * Link multiple fitments to a product
 */
export async function POST(
  req: MedusaRequest<{ fitment_ids: string[] }>,
  res: MedusaResponse,
) {
  const controller = new ProductController(req, res);
  await controller.linkFitmentsToProduct();
}
