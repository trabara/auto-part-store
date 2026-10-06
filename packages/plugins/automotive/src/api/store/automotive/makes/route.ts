import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { makes } from "../selector";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  res.json({ makes: await makes(req) });
}
