import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ProductController } from "../../../../_controllers";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new ProductController(req, res);
  await controller.getFitmentsForProduct();
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new ProductController(req, res);
  await controller.linkFitmentsToProduct();
};
