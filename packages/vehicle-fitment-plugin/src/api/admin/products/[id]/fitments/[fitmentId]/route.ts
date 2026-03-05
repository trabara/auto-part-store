import { ProductController } from "@/modules/fitment/controllers/product";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * DELETE /admin/products/:id/fitments/:fitmentId
 * Unlink a specific fitment from a product
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ProductController(req, res);
  await controller.unlinkFitmentFromProduct();
}
