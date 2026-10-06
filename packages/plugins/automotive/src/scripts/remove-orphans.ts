// One-off cleanup of records left behind before deletions cascaded:
//   npx medusa exec <plugin>/.medusa/server/src/scripts/remove-orphans.js
// Idempotent: only soft-deletes rows whose variant, vehicle or customer is gone.
import type { ExecArgs } from "@medusajs/framework/types";
import { removeOrphans } from "../lib/orphans";

export default async function removeOrphansScript({ container }: ExecArgs) {
  const removed = await removeOrphans(container as any);
  container.resolve("logger").info(
    `[automotive] orphans removed: ${removed.fitments} fitment(s), ${removed.partNumbers} part number(s), ${removed.garage} garage vehicle(s)`,
  );
}
