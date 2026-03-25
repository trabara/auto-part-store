import {
  MedusaRequest,
  MedusaResponse
} from "@medusajs/framework/http";
import { StoreController } from "../../../_controllers/store";

/**
 * GET /admin/store/details
 * Get the details of the store
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse,
) => {
  const controller = new StoreController(req, res);
  await controller.getOne();
};

/**
 * POST /admin/store/details
 * Update the details of the store
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse,
) => {
  const controller = new StoreController(req, res);
  await controller.update();
};
