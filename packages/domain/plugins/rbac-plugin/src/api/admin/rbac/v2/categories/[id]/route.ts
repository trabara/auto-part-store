import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CategoryController } from "../../../../../_controllers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new CategoryController(req, res);
  await controller.getById();
};

export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new CategoryController(req, res);
  await controller.update();
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new CategoryController(req, res);
  await controller.delete();
};
