// Generic admin API of the fitment module: `/admin/fitments/:entity[/:id]`
// (path declared by its entity set). Condition groups and conditions are
// edited as one tree (`/admin/fitments/fitment/:id/conditions`), not here.
import { createEntityRoutes } from "@repo/framework/entity/server";
import { AutomotiveAttribute, Fitment, FitmentPosition, fitmentEntities } from "./entities";

export const FITMENTS_PATH = `/admin/${fitmentEntities.path}`;

export const fitmentRoutes = createEntityRoutes({ entities: [Fitment, FitmentPosition, AutomotiveAttribute] });
