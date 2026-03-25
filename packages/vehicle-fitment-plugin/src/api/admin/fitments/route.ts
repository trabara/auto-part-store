import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CreateFitmentInput } from "../../../modules/fitment/schema";
import { FitmentController } from "../../controllers/fitment";

/**
 * GET /admin/fitments
 * List all fitments with pagination and filtering
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new FitmentController(req, res);
  await controller.list();
}

/**
 * POST /admin/fitments
 * Create a new fitment with nested entities
 */
export async function POST(
  req: MedusaRequest<CreateFitmentInput>,
  res: MedusaResponse,
) {
  const controller = new FitmentController(req, res);
  await controller.create();
}
