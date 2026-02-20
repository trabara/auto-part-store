import { ProductFitmentsController } from "@/modules/fitment/controllers/product-fitments";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * DELETE /admin/products/:id/fitments/:fitmentId
 * Unlink a specific fitment from a product
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ProductFitmentsController(req, res);
  await controller.unlinkFitmentFromProduct();
}
