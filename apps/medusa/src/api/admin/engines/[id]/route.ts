import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { EnginesController } from "../../controllers/engines.controller";
import { UpdateEngineInput } from "../../../../modules/fitment/schema";

/**
 * GET /admin/engines/:id
 * Get a single engine by ID with related fitments
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new EnginesController(req, res);
  await controller.getById();
}

/**
 * PATCH /admin/engines/:id
 * Update a single engine by ID
 */
export async function PATCH(
  req: MedusaRequest<UpdateEngineInput>,
  res: MedusaResponse,
) {
  const controller = new EnginesController(req, res);
  await controller.update();
}

/**
 * DELETE /admin/engines/:id
 * Delete an engine and cascade delete related entities
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new EnginesController(req, res);
  await controller.delete();
}
