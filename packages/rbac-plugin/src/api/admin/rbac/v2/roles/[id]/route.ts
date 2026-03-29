import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { RoleController } from "../../../../../_controllers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new RoleController(req, res);
  await controller.get();
};

export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new RoleController(req, res);
  await controller.update();
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new RoleController(req, res);
  await controller.delete();
};
