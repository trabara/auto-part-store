import { EngineController } from "@/modules/fitment/controllers/engine";
import {
  CreateEngineInput,
  UpdateEngineInput,
} from "@/modules/fitment/schema";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/**
 * GET /admin/engines
 * List all engines
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new EngineController(req, res);
  await controller.list();
};

/**
 * POST /admin/engines
 * Create a new engine
 */
export const POST = async (
  req: MedusaRequest<CreateEngineInput>,
  res: MedusaResponse,
) => {
  const controller = new EngineController(req, res);
  await controller.create();
};

/**
 * PATCH /admin/engines
 * Update multiple engines
 */
export const PATCH = async (
  req: MedusaRequest<{ engines: UpdateEngineInput[] }>,
  res: MedusaResponse,
) => {
  const controller = new EngineController(req, res);
  await controller.updateBatch();
};
