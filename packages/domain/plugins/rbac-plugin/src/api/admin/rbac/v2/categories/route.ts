import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CategoryController } from "../../../../_controllers";

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const controller = new CategoryController(req, res);
  await controller.list();
};

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const controller = new CategoryController(req, res);
  await controller.create();
};