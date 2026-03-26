import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PermissionController } from "../../../_controllers";

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new PermissionController(req, res);
  await controller.delete();
};
