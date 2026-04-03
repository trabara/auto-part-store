import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PermissionController } from "../../../../../_controllers";

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const controller = new PermissionController(req, res);
  await controller.get();
};

export const PATCH = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const controller = new PermissionController(req, res);
  await controller.update();
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const controller = new PermissionController(req, res);
  await controller.delete();
};
