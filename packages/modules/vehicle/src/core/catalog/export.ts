// The catalog as it is: existing records written back as a `vehicle-catalog@1`
// file (what a researcher, human or agent, starts from), and how complete
// each model is (which models to research first).
import type { CatalogFile, CatalogVehicle } from "../../contract/catalog";
import { SourceTier } from "../../contract/entities/enums";

type Engine = {
  code: string | null;
  fuel: string;
  layout: string | null;
  cylinders: number | null;
  displacement_cc: number | null;
  power_kw: number;
  name?: string | null;
};

/** Existing records of some makes, nested as the import reads them. */
export type CatalogRecords = {
  makes: { id: string; name: string }[];
  models: { id: string; make_id: string; name: string; category: string }[];
  generations: { id: string; model_id: string; name: string; code: string | null; year_start: number; year_end: number | null }[];
  vehicles: {
    id: string;
    generation_id: string;
    engine: Engine;
    body_style: string;
    doors: number;
    drive: string;
    transmission: string;
    trim: string | null;
    year_start: number;
    year_end: number | null;
  }[];
  references: { vehicle_id: string; source: string; external_id: string }[];
};

type RecordVehicle = CatalogRecords["vehicles"][number];

/** Rows grouped by a parent key (one pass), read back by parent. */
export function childrenOf<T, K extends keyof T>(rows: T[], key: K): (parent: unknown) => T[] {
  const map = new Map<unknown, T[]>();
  for (const row of rows) {
    const list = map.get(row[key]);
    if (list) list.push(row);
    else map.set(row[key], [row]);
  }
  return (parent) => map.get(parent) ?? [];
}

/** An existing configuration as a catalog file writes it. */
export const toCatalogVehicle = (v: RecordVehicle, references: CatalogRecords["references"] = []): CatalogVehicle => ({
  engine: {
    code: v.engine.code,
    fuel: v.engine.fuel as any,
    layout: v.engine.layout as any,
    cylinders: v.engine.cylinders,
    displacement_cc: v.engine.displacement_cc,
    power_kw: v.engine.power_kw,
    ...(v.engine.name ? { name: v.engine.name } : {}),
  },
  body_style: v.body_style as any,
  doors: v.doors,
  drive: v.drive as any,
  transmission: v.transmission as any,
  trim: v.trim,
  year_start: v.year_start,
  year_end: v.year_end,
  references: references.map((r) => ({ source: r.source as any, external_id: r.external_id })),
});

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
const byYear = (a: { year_start: number }, b: { year_start: number }) => a.year_start - b.year_start;

/** The records as a catalog file (makes, models and generations by name / year). */
export function recordsToCatalog(
  records: CatalogRecords,
  source: Omit<CatalogFile["source"], "tier"> & { tier?: CatalogFile["source"]["tier"] },
  market?: string,
): CatalogFile {
  const models = childrenOf(records.models, "make_id");
  const generations = childrenOf(records.generations, "model_id");
  const vehicles = childrenOf(records.vehicles, "generation_id");
  const references = childrenOf(records.references, "vehicle_id");
  return {
    format: "vehicle-catalog@1",
    ...(market ? { market } : {}),
    // The catalog as a source is the lowest tier: re-importing it upgrades nothing.
    source: { ...source, tier: source.tier ?? SourceTier.DRAFT },
    makes: [...records.makes].sort(byName).map((make) => ({
      name: make.name,
      models: [...models(make.id)].sort(byName).map((model) => ({
        name: model.name,
        category: model.category as any,
        generations: [...generations(model.id)].sort(byYear).map((g) => ({
          name: g.name,
          code: g.code,
          year_start: g.year_start,
          year_end: g.year_end,
          vehicles: [...vehicles(g.id)].sort(byYear).map((v) => toCatalogVehicle(v, references(v.id))),
        })),
      })),
    })),
  };
}

/** How complete a model is in the catalog. */
export type ModelCoverage = {
  make: string;
  model: string;
  category: string;
  generations: number;
  /** Generations without any configuration. */
  empty_generations: number;
  configurations: number;
};

/** Every model's coverage, least complete first (no generations, then fewest configurations). */
export function catalogCoverage(records: Omit<CatalogRecords, "vehicles" | "references"> & {
  vehicles: { generation_id: string }[];
}): ModelCoverage[] {
  const makeName = new Map(records.makes.map((m) => [m.id, m.name]));
  const configurations = new Map<string, number>();
  for (const v of records.vehicles) configurations.set(v.generation_id, (configurations.get(v.generation_id) ?? 0) + 1);
  const generationsOf = childrenOf(records.generations, "model_id");
  return records.models
    .map((model) => {
      const gens = generationsOf(model.id);
      const counts = gens.map((g) => configurations.get(g.id) ?? 0);
      return {
        make: makeName.get(model.make_id) ?? "",
        model: model.name,
        category: model.category,
        generations: gens.length,
        empty_generations: counts.filter((c) => c === 0).length,
        configurations: counts.reduce((a, b) => a + b, 0),
      };
    })
    .sort(
      (a, b) =>
        Number(b.generations === 0) - Number(a.generations === 0) ||
        a.configurations - b.configurations ||
        b.empty_generations - a.empty_generations ||
        a.make.localeCompare(b.make) ||
        a.model.localeCompare(b.model),
    );
}
