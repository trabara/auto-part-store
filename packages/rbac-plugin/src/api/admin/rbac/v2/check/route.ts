import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CheckController } from "../../../../_controllers";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new CheckController(req, res);
  await controller.check();
};
