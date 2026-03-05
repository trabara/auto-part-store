import { ModelsController } from "@/modules/fitment/controllers";
import { UpdateModelInput } from "@/modules/fitment/schema";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * GET /admin/models/:id
 * Get a single model by ID with related make and fitments
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ModelsController(req, res);
  await controller.getById();
}

/**
 * PATCH /admin/models/:id
 * Update a single model by ID
 */
export async function PATCH(
  req: MedusaRequest<UpdateModelInput>,
  res: MedusaResponse,
) {
  const controller = new ModelsController(req, res);
  await controller.update();
}

/**
 * DELETE /admin/models/:id
 * Delete a model and cascade delete related entities
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ModelsController(req, res);
  await controller.delete();
}
