// What to research next, one focused task at a time: the generations of a
// model that has none, or the configurations of one generation. Small tasks
// keep a researcher (human or agent) on one question with little context.
import type { CatalogVehicle } from "../../contract/catalog";
import { childrenOf, type CatalogRecords } from "./export";

type Generation = { name: string; code: string | null; year_start: number; year_end: number | null };

export type ResearchTask =
  | { kind: "generations"; make: string; model: string; category: string }
  | {
      kind: "configurations";
      make: string;
      model: string;
      category: string;
      /** The generation to research (its name is the catalog's key: keep it). */
      generation: Generation;
      /** The model's generations, with how many configurations each has. */
      generations: (Generation & { configurations: number })[];
      configurations: number;
      /** Its configurations already in the catalog (filled in by the service). */
      existing?: CatalogVehicle[];
      /** The generation's id, to load `existing`. */
      generation_id: string;
    };

/**
 * Research tasks, most useful first: models without generations, then
 * generations with at most `maxConfigurations` configurations (fewest first,
 * then the most recent: still produced, or ended last).
 */
export function researchTasks(
  records: Omit<CatalogRecords, "vehicles" | "references"> & { vehicles: { generation_id: string }[] },
  options: { maxConfigurations?: number } = {},
): ResearchTask[] {
  const max = options.maxConfigurations ?? 0;
  const makeName = new Map(records.makes.map((m) => [m.id, m.name]));
  const counts = new Map<string, number>();
  for (const v of records.vehicles) counts.set(v.generation_id, (counts.get(v.generation_id) ?? 0) + 1);
  const generationsOf = childrenOf(records.generations, "model_id");
  const pick = ({ name, code, year_start, year_end }: Generation) => ({ name, code, year_start, year_end });

  const models = [...records.models]
    .map((m) => ({ ...m, make: makeName.get(m.make_id) ?? "" }))
    .sort((a, b) => a.make.localeCompare(b.make) || a.name.localeCompare(b.name));
  const generationTasks: ResearchTask[] = [];
  const configurationTasks: Extract<ResearchTask, { kind: "configurations" }>[] = [];
  for (const model of models) {
    const gens = [...generationsOf(model.id)].sort((a, b) => a.year_start - b.year_start);
    const base = { make: model.make, model: model.name, category: model.category };
    if (!gens.length) {
      generationTasks.push({ kind: "generations", ...base });
      continue;
    }
    const siblings = gens.map((g) => ({ ...pick(g), configurations: counts.get(g.id) ?? 0 }));
    for (const g of gens) {
      const configurations = counts.get(g.id) ?? 0;
      if (configurations > max) continue;
      configurationTasks.push({ kind: "configurations", ...base, generation: pick(g), generations: siblings, configurations, generation_id: g.id });
    }
  }
  configurationTasks.sort(
    (a, b) =>
      a.configurations - b.configurations ||
      (b.generation.year_end ?? Infinity) - (a.generation.year_end ?? Infinity) ||
      b.generation.year_start - a.generation.year_start,
  );
  return [...generationTasks, ...configurationTasks];
}
