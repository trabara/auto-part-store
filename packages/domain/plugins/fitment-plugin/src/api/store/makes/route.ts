import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MakeController } from "../../_controllers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new MakeController(req, res);
  await controller.list();
};
