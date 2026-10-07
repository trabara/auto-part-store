// One-off cleanup of records left behind before deletions cascaded:
//   (from apps/backend) npx medusa exec ../../packages/domains/automotive/.medusa/server/src/scripts/remove-orphans.js
// Idempotent: only soft-deletes rows whose variant, vehicle or customer is gone.
import type { ExecArgs } from "@medusajs/framework/types";
import { removeOrphansWorkflow } from "../workflows/remove-orphans";

export default async function removeOrphansScript({ container }: ExecArgs) {
  const { result } = await removeOrphansWorkflow(container).run({ input: { all: true } });
  container.resolve("logger").info(
    `[automotive] orphans removed: ${result.fitments} fitment(s), ${result.partNumbers} part number(s), ${result.garage} garage vehicle(s)`,
  );
}
