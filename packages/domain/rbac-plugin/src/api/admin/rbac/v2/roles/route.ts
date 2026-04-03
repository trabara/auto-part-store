import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { RoleController } from "../../../../_controllers";

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const controller = new RoleController(req, res);
  await controller.list();
};

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const controller = new RoleController(req, res);
  await controller.create();
};
