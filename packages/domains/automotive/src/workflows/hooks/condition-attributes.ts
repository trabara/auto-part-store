// Domain wiring (vehicle → fitment): fitment conditions test vehicle fields.
// Registers the catalog, and the translations its stored summaries are
// written in, with the fitment module when Medusa loads the hooks.
import { provideConditionTranslations } from "@repo/module-fitment/contract";
import { registerVehicleConditions } from "../../conditions/vehicle-attributes";
import resources from "../../i18n";

registerVehicleConditions();
provideConditionTranslations(resources);
