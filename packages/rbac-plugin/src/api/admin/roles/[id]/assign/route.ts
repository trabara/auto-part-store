import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { RoleController } from "../../../../_controllers";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new RoleController(req, res);
  await controller.assign();
};
