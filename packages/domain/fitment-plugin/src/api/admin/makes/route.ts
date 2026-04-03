import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { CreateMakeInput, UpdateMakeInput } from "@trabara/core/dtos";
import { MakeController } from "../../_controllers/make";

/**
 * GET /admin/makes
 * List all vehicle makes
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new MakeController(req, res);
  await controller.list();
};

/**
 * POST /admin/makes
 * Create a new vehicle make
 */
export const POST = async (
  req: MedusaRequest<CreateMakeInput>,
  res: MedusaResponse,
) => {
  const controller = new MakeController(req, res);
  await controller.create();
};

/**
 * PATCH /admin/makes
 * Update multiple makes
 */
export const PATCH = async (
  req: MedusaRequest<{ makes: UpdateMakeInput[] }>,
  res: MedusaResponse,
) => {
  const controller = new MakeController(req, res);
  await controller.updateBatch();
};
