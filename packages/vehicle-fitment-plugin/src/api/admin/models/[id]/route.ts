import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { UpdateModelInput } from "../../../../modules/fitment/schema";
import { ModelController } from "../../../_controllers/model";

/**
 * GET /admin/models/:id
 * Get a single model by ID with related make and fitments
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ModelController(req, res);
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
  const controller = new ModelController(req, res);
  await controller.update();
}

/**
 * DELETE /admin/models/:id
 * Delete a model and cascade delete related entities
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new ModelController(req, res);
  await controller.delete();
}
