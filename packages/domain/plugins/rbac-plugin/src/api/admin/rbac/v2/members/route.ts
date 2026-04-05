import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MemberController } from "../../../../_controllers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new MemberController(req, res);
  await controller.list();
};
