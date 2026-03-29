import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CategoryController } from "../../../../_controllers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new CategoryController(req, res);
  await controller.list();
};
