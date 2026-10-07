// Translations of the automotive domain: each module ships its own (typed by
// its English messages), plus the domain's. Isomorphic: the admin loads them
// (src/admin/i18n), the server writes condition summaries in every locale.
import { toAdminI18n } from "@repo/framework/core";
import { fitmentTranslations as fitments } from "@repo/module-fitment/admin";
import { partsTranslations as parts } from "@repo/module-parts/admin";
import { vehicleTranslations as vehicles } from "@repo/module-vehicle/admin";
import automotive from "./automotive";

export default toAdminI18n(vehicles, fitments, parts, automotive);
