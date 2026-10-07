// How complete each model is, least complete first: the research queue.
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { vehicleService } from "../../../request";
import type { AdminCatalogCoverageParams } from "../../validators";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { make, max_configurations, limit, offset } = req.validatedQuery as AdminCatalogCoverageParams;
  const all = await vehicleService(req).catalogCoverage({ make });
  const models = max_configurations == null ? all : all.filter((m) => m.configurations <= max_configurations);
  res.json({
    models: models.slice(offset, offset + limit),
    count: models.length,
    limit,
    offset,
    summary: {
      models: all.length,
      without_generations: all.filter((m) => m.generations === 0).length,
      without_configurations: all.filter((m) => m.configurations === 0).length,
    },
  });
}
