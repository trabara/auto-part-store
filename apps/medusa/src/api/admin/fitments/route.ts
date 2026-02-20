import { FitmentsController } from "@/modules/fitment/controllers/fitments";
import {
  CreateFitmentInput,
  UpdateFitmentInput,
} from "@/modules/fitment/schema";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * GET /admin/fitments
 * List all fitments with pagination and filtering
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const controller = new FitmentsController(req, res);
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
  const controller = new FitmentsController(req, res);
  await controller.create();
}

/**
 * PATCH /admin/fitments
 * Update an existing fitment
 */
export async function PATCH(
  req: MedusaRequest<UpdateFitmentInput>,
  res: MedusaResponse,
) {
  const controller = new FitmentsController(req, res);
  await controller.update();
}
