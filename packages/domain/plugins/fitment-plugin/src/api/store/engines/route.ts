import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { EngineController } from "../../_controllers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new EngineController(req, res);
  await controller.list();
};
