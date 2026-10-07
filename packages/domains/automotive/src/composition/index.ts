// Composition root of the automotive domain: plugs the domain's adapters into
// its modules' ports. Called once per runtime: on the server by a workflow
// hook (../workflows/hooks/composition.ts), in the admin by ../admin/setup.ts.
import { provideConditionAttributes, provideConditionTranslations } from "@repo/module-fitment/contract";
import resources from "../contract/i18n";
import { VEHICLE_ATTRIBUTES } from "../core/condition-attributes";

/** Idempotent: registering again replaces with the same adapters. */
export function composeAutomotive(): void {
  // Fitment conditions test vehicle fields…
  provideConditionAttributes(VEHICLE_ATTRIBUTES);
  // …and store their summaries in every locale the domain translates.
  provideConditionTranslations(resources);
}
