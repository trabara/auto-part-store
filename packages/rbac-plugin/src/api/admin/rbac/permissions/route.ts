import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PermissionController } from "../../../_controllers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new PermissionController(req, res);
  await controller.list();
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new PermissionController(req, res);
  await controller.create();
};
