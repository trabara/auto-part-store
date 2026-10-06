import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { params, required, vehicleService } from "../selector";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  const { generation_id, year } = params(req);
  res.json({ vehicles: await vehicleService(req).selectorVehicles(required(generation_id, "generation_id"), year) });
}
