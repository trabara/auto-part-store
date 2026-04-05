import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { FitmentController } from "../../_controllers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new FitmentController(req, res);
  await controller.list();
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new FitmentController(req, res);
  await controller.create();
};
