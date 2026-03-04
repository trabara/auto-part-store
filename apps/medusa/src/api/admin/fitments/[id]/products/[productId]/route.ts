import { ProductController } from "@/modules/fitment/controllers/product";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * DELETE /admin/fitments/:id/products/:productId
 * Unlink a specific product from a fitment
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ProductController(req, res);
  await controller.unlinkProductFromFitment();
}
