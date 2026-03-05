import { ModelsController } from "@/modules/fitment/controllers";
import {
  CreateModelInput,
  UpdateModelInput,
} from "@/modules/fitment/schema";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * GET /admin/models
 * List all vehicle models
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new ModelsController(req, res);
  await controller.list();
};

/**
 * POST /admin/models
 * Create a new vehicle model
 */
export const POST = async (
  req: MedusaRequest<CreateModelInput>,
  res: MedusaResponse,
) => {
  const controller = new ModelsController(req, res);
  await controller.create();
};

/**
 * PATCH /admin/models
 * Update multiple models
 */
export const PATCH = async (
  req: MedusaRequest<{ models: UpdateModelInput[] }>,
  res: MedusaResponse,
) => {
  const controller = new ModelsController(req, res);
  await controller.updateBatch();
};
