import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ProductFitmentsController } from "../../../../../controllers/product-fitments.controller";

/**
 * DELETE /admin/fitments/:id/products/:productId
 * Unlink a specific product from a fitment
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ProductFitmentsController(req, res);
  await controller.unlinkProductFromFitment();
}
