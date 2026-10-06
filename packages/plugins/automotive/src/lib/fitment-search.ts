// Which variants fit a vehicle. Behind an interface so a search engine
// (Meilisearch, Typesense) can replace the Postgres implementation for
// large catalogs without touching the store routes.
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { FITMENT_MODULE } from "../modules/fitment";
import { VEHICLE_ATTRIBUTE_PATHS } from "../modules/fitment/entities";

type Container = { resolve: <T = any>(key: string) => T };

/** When the vehicle was built, if known (garage vehicles): narrows production windows. */
export type BuildDate = { year: number; month?: number | null };

export type FitmentMatch = {
  id: string;
  variant_id: string;
  quantity: number;
  from_year: number | null;
  from_month: number | null;
  to_year: number | null;
  to_month: number | null;
  notes: string | null;
  /** When it applies, e.g. "Drive is front-wheel drive" (null: always). */
  conditions: string | null;
  position: { id: string; code: string; name: string } | null;
};

export interface FitmentSearch {
  /** Fitments of the vehicle whose window and conditions match, grouped by variant. */
  fittingVariants(vehicleId: string, build?: BuildDate): Promise<Map<string, FitmentMatch[]>>;
}

const point = (year: number, month?: number | null) => year * 100 + (month ?? 0);

/** Whether a fitment's production window contains the build date (open ends match). */
export function windowContains(f: Pick<FitmentMatch, "from_year" | "from_month" | "to_year" | "to_month">, build?: BuildDate) {
  if (!build) return true;
  // Without a build month, a window boundary month can't exclude the year.
  const at = (month?: number | null) => point(build.year, build.month ?? month);
  if (f.from_year != null && at(12) < point(f.from_year, f.from_month ?? 1)) return false;
  if (f.to_year != null && at(1) > point(f.to_year, f.to_month ?? 12)) return false;
  return true;
}

/** Nests flat condition groups (parent_id) under their fitment. */
function attachGroups(fitments: any[], groups: any[]) {
  const byId = new Map(groups.map((g) => [g.id, { ...g, children: [] as any[] }]));
  const roots = new Map<string, any[]>();
  for (const g of byId.values()) {
    if (g.parent_id && byId.has(g.parent_id)) byId.get(g.parent_id)!.children.push(g);
    else roots.set(g.fitment_id, [...(roots.get(g.fitment_id) ?? []), g]);
  }
  return fitments.map((f) => ({ ...f, conditionGroups: roots.get(f.id) ?? [] }));
}

export class PostgresFitmentSearch implements FitmentSearch {
  constructor(private readonly container: Container) {}

  async fittingVariants(vehicleId: string, build?: BuildDate) {
    const fitmentService = this.container.resolve<any>(FITMENT_MODULE);
    const query = this.container.resolve<any>(ContainerRegistrationKeys.QUERY);

    const fitments: any[] = await fitmentService.listFitments(
      { vehicle_id: vehicleId },
      {
        select: ["id", "variant_id", "quantity", "from_year", "from_month", "to_year", "to_month", "notes", "conditions_summary"],
        relations: ["position"],
      },
    );
    const inWindow = fitments.filter((f) => windowContains(f, build));
    if (!inWindow.length) return new Map<string, FitmentMatch[]>();

    // Conditions test the vehicle's fields (drive, engine.fuel, …).
    const groups: any[] = await fitmentService.listFitmentConditionGroups(
      { fitment_id: inWindow.map((f) => f.id) },
      { relations: ["conditions", "conditions.attribute"] },
    );
    let compatible = inWindow;
    if (groups.length) {
      const { data: [vehicle] } = await query.graph({
        entity: "vehicle",
        fields: ["id", ...VEHICLE_ATTRIBUTE_PATHS],
        filters: { id: vehicleId },
      });
      const ids = new Set(
        fitmentService.filterCompatible(attachGroups(inWindow, groups), vehicle ?? {}).map((f: any) => f.id),
      );
      compatible = inWindow.filter((f) => ids.has(f.id));
    }

    const byVariant = new Map<string, FitmentMatch[]>();
    for (const f of compatible) {
      const match: FitmentMatch = {
        id: f.id,
        variant_id: f.variant_id,
        quantity: f.quantity,
        from_year: f.from_year,
        from_month: f.from_month,
        to_year: f.to_year,
        to_month: f.to_month,
        notes: f.notes,
        conditions: f.conditions_summary ?? null,
        position: f.position ? { id: f.position.id, code: f.position.code, name: f.position.name } : null,
      };
      byVariant.set(f.variant_id, [...(byVariant.get(f.variant_id) ?? []), match]);
    }
    return byVariant;
  }
}

/** The search implementation for a request scope. */
export const fitmentSearch = (container: Container): FitmentSearch => new PostgresFitmentSearch(container);
