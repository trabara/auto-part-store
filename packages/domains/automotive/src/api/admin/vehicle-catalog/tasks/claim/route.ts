// Leases the most valuable tasks to a worker. Serialized: two runs never get the same task.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { vehicleService, withLock } from "../../../../request";
import type { AdminStewardClaimBody } from "../../../validators";

export async function POST(req: MedusaRequest<AdminStewardClaimBody>, res: MedusaResponse) {
  const { limit, kinds, make, lease_minutes } = req.validatedBody;
  const tasks = await withLock(req, "vehicle-catalog:claim", () =>
    vehicleService(req).claimTasks({ limit, kinds, make, leaseMinutes: lease_minutes }),
  );
  res.json({
    tasks: tasks.map((t: any) => ({
      id: t.id,
      kind: t.kind,
      key: t.key,
      make: t.make,
      model: t.model,
      generation: t.generation,
      priority: t.priority,
      attempts: t.attempts,
      feedback: t.feedback,
      lease_token: t.lease_token,
      lease_until: t.lease_until,
    })),
  });
}
