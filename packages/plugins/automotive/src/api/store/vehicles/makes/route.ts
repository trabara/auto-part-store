import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { vehicleService } from "../selector";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  res.json({ makes: await vehicleService(req).selectorMakes() });
}
