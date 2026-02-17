import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MakesController } from "../../../controllers/makes.controller";
import { UpdateMakeInput } from "../../../../modules/fitment/schema";

/**
 * GET /admin/makes/:id
 * Get a single make by ID with related models
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new MakesController(req, res);
  await controller.getById();
}

/**
 * PATCH /admin/makes/:id
 * Update a single make by ID
 */
export async function PATCH(
  req: MedusaRequest<UpdateMakeInput>,
  res: MedusaResponse,
) {
  const controller = new MakesController(req, res);
  await controller.update();
}

/**
 * DELETE /admin/makes/:id
 * Delete a make and cascade delete related entities
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const controller = new MakesController(req, res);
  await controller.delete();
}
