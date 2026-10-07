// Checks every catalog record against the rules: safe fixes applied, the rest
// kept as cleanup tasks for review (free, run before each night's research).
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { vehicleService } from "../../../request";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.json(await vehicleService(req).runLint());
}
