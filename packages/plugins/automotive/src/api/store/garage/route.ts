// The logged-in customer's garage ("my vehicles").
import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createEntitiesWorkflow, withReadableErrors } from "@repo/framework/entity/server";
import { CustomerVehicle } from "../../../modules/vehicle/entities";
import { customerId, GARAGE_TARGET, ownGarageVehicle, vehicleService } from "./helpers";

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.json({ vehicles: await vehicleService(req).listGarage(customerId(req)) });
}

export async function POST(req: AuthenticatedMedusaRequest<Record<string, unknown>>, res: MedusaResponse) {
  const { result } = await withReadableErrors(CustomerVehicle, () =>
    createEntitiesWorkflow(req.scope).run({
      input: { ...GARAGE_TARGET, data: [{ ...req.validatedBody, customer_id: customerId(req) }] },
    }),
  );
  res.status(201).json({ vehicle: await ownGarageVehicle(req, result[0]!.id) });
}
