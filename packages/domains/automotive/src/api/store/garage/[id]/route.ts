import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  deleteEntitiesWorkflow,
  updateEntitiesWorkflow,
  withReadableErrors,
} from "@repo/framework/entity/server";
import { CustomerVehicle } from "@repo/module-vehicle/contract";
import { GARAGE_TARGET, ownGarageVehicle } from "../../../request";

export async function PUT(req: AuthenticatedMedusaRequest<Record<string, unknown>>, res: MedusaResponse) {
  const { id } = req.params;
  await ownGarageVehicle(req, id!);
  await withReadableErrors(CustomerVehicle, () =>
    updateEntitiesWorkflow(req.scope).run({ input: { ...GARAGE_TARGET, data: [{ ...req.validatedBody, id: id! }] } }),
  );
  res.json({ vehicle: await ownGarageVehicle(req, id!) });
}

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  await ownGarageVehicle(req, id!);
  await deleteEntitiesWorkflow(req.scope).run({ input: { ...GARAGE_TARGET, ids: [id!] } });
  res.json({ id, object: "customer_vehicle", deleted: true });
}
