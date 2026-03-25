import { FitmentController } from "../../../controllers/fitment";
import { UpdateFitmentInput } from "../../../../modules/fitment/schema";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * GET /admin/fitments/:id
 * Get a single fitment by ID with all relations
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new FitmentController(req, res);
  await controller.getById();
}

/**
 * DELETE /admin/fitments/:id
 * Delete a fitment by ID
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new FitmentController(req, res);
  await controller.delete();
}

/**
 * PATCH /admin/fitments
 * Update an existing fitment
 */
export async function PATCH(
  req: MedusaRequest<UpdateFitmentInput>,
  res: MedusaResponse,
) {
  const controller = new FitmentController(req, res);
  await controller.update();
}
