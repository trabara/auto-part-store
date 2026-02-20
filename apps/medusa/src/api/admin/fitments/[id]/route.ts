import { FitmentsController } from "@/modules/fitment/controllers/fitments";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * GET /admin/fitments/:id
 * Get a single fitment by ID with all relations
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new FitmentsController(req, res);
  await controller.getById();
}

/**
 * DELETE /admin/fitments/:id
 * Delete a fitment by ID
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new FitmentsController(req, res);
  await controller.delete();
}
