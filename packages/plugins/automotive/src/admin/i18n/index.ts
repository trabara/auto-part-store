// Admin translations of the automotive domain: each module ships its own
// (typed by its English messages); Medusa loads the merged resources.
import { toAdminI18n } from "@repo/framework/core";
import fitments from "../../modules/fitment/admin/i18n";
import parts from "../../modules/parts/admin/i18n";
import vehicles from "../../modules/vehicle/admin/i18n";

export default toAdminI18n(vehicles, fitments, parts);
