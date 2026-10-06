import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { params, required, vehicles } from "../selector";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  const { generation_id, year } = params(req);
  res.json({ vehicles: await vehicles(req, required(generation_id, "generation_id"), year) });
}
