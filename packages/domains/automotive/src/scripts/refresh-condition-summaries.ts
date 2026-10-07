// Rewrites the stored condition summaries of every fitment in every locale
// (after a migration or a translation change):
//   (from apps/backend) npx medusa exec ../../packages/domains/automotive/.medusa/server/src/scripts/refresh-condition-summaries.js
import type { ExecArgs } from "@medusajs/framework/types";
import { FITMENT_MODULE, type FitmentModuleService } from "@repo/module-fitment";

export default async function refreshConditionSummaries({ container }: ExecArgs) {
  const count = await container.resolve<FitmentModuleService>(FITMENT_MODULE).refreshConditionSummaries();
  container.resolve("logger").info(`[automotive] condition summaries refreshed: ${count} fitment(s)`);
}
