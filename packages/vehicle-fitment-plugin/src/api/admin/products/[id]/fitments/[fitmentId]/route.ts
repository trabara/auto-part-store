import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ProductController } from "../../../../../_controllers/product";

/**
 * DELETE /admin/products/:id/fitments/:fitmentId
 * Unlink a specific fitment from a product
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ProductController(req, res);
  await controller.unlinkFitmentFromProduct();
}
