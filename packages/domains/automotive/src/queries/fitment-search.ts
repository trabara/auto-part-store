// Which variants fit a vehicle. Behind an interface so a search engine
// (Meilisearch, Typesense) can replace the Postgres implementation for
// large catalogs without touching the store routes.
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { FITMENT_MODULE, type FitmentModuleService } from "@repo/module-fitment";
import { VEHICLE_ATTRIBUTE_PATHS } from "../conditions/vehicle-attributes";
import type { BuildDate, FitmentMatch } from "@repo/module-fitment";

type Container = { resolve: <T = any>(key: string) => T };

export type { BuildDate, FitmentMatch };

export interface FitmentSearch {
  /** Fitments of the vehicle whose window and conditions match, grouped by variant. */
  fittingVariants(vehicleId: string, build?: BuildDate): Promise<Map<string, FitmentMatch[]>>;
}

/** Postgres: the vehicle's fields (vehicle module) evaluated by the fitment module. */
export class PostgresFitmentSearch implements FitmentSearch {
  constructor(private readonly container: Container) {}

  async fittingVariants(vehicleId: string, build?: BuildDate) {
    const query = this.container.resolve<any>(ContainerRegistrationKeys.QUERY);
    const { data: [vehicle] } = await query.graph({
      entity: "vehicle",
      fields: ["id", ...VEHICLE_ATTRIBUTE_PATHS],
      filters: { id: vehicleId },
    });
    return this.container.resolve<FitmentModuleService>(FITMENT_MODULE).findMatching(vehicleId, vehicle ?? {}, build);
  }
}

/** The search implementation for a request scope. */
export const fitmentSearch = (container: Container): FitmentSearch => new PostgresFitmentSearch(container);
