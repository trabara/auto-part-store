// Settles a task waiting for review as proposed (import, corrections, cleanup
// fix). Merging configurations touches fitments and garages: the domain's workflow.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { CatalogEntityName, CatalogTaskKind, CatalogTaskStatus } from "@repo/module-vehicle/contract";
import { mergeVehiclesWorkflow } from "../../../../../../workflows/merge-vehicles";
import { vehicleService } from "../../../../../request";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = vehicleService(req);
  const task = (await service.retrieveCatalogTask(req.params.id!)) as any;
  const fix = task.finding?.fix;
  if (task.kind === CatalogTaskKind.CLEANUP && task.entity === CatalogEntityName.Vehicle && fix?.kind === "merge") {
    if (task.status !== CatalogTaskStatus.REVIEW) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only tasks waiting for review can be approved.");
    const { result } = await mergeVehiclesWorkflow(req.scope).run({ input: { from_id: task.record_id, into_id: fix.into } });
    await service.markTaskDone(task.id, { merged: result });
    res.json({ result: { merged: result } });
    return;
  }
  res.json({ result: await service.approveTask(task.id) });
}
