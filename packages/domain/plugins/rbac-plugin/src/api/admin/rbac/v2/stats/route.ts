import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { StatsController } from "../../../../_controllers";

export const GET = (req: MedusaRequest, res: MedusaResponse) =>
  new StatsController(req, res).get();
