import { ProductController } from "../../../../_controllers/product";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * GET /store/products/:id/fitments
 * Get all fitments linked to a product (public store endpoint)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ProductController(req, res);
  await controller.getFitmentsForProduct();
}
