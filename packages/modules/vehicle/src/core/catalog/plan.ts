// What importing a catalog file would change, given what exists: records to
// create (in dependency order, with references to existing ids or to records
// created earlier in the plan), records that exist, and existing values the
// file contradicts. The mode decides what happens to those: `create` reports
// them, `fill` writes the file's value only where the record has none (e.g. a
// missing code, or an end year for a generation still listed as current), and
// `overwrite` writes them all (for reviewed files).
import type { CatalogEngine, CatalogFile, CatalogImportMode, CatalogVehicle } from "../../contract/catalog";
import { engineKey, generationKey, makeKey, modelKey, vehicleKey } from "./keys";

/** An existing record (`id`) or one the plan creates (`key`). */
export type CatalogRef = { id: string } | { key: string };

/** The records of the vehicle module an import needs to know about. */
export type CatalogSnapshot = {
  makes: { id: string; name: string }[];
  models: { id: string; make_id: string; name: string; category: string }[];
  generations: { id: string; model_id: string; name: string; code: string | null; year_start: number; year_end: number | null }[];
  engines: { id: string; code: string | null; fuel: string; layout: string | null; cylinders: number | null; displacement_cc: number | null; power_kw: number }[];
  vehicles: {
    id: string;
    generation_id: string;
    engine_id: string;
    body_style: string;
    drive: string;
    transmission: string;
    trim: string | null;
    year_start: number;
    year_end: number | null;
    doors: number;
  }[];
  references: { source: string; external_id: string; vehicle_id: string }[];
};

/** Fields of an existing record to update, and why (one line per field). */
export type CatalogUpdate = {
  entity: "VehicleModel" | "VehicleGeneration" | "Vehicle";
  id: string;
  /** The record, as a path (Make › Model › Generation › #n). */
  where: string;
  data: Record<string, unknown>;
  changes: string[];
};

export type CatalogPlan = {
  makes: { key: string; data: { name: string } }[];
  models: { key: string; make: CatalogRef; data: { name: string; category: string } }[];
  generations: {
    key: string;
    model: CatalogRef;
    data: { name: string; code: string | null; year_start: number; year_end: number | null };
  }[];
  engines: { key: string; data: CatalogEngine }[];
  vehicles: { key: string; generation: CatalogRef; engine: CatalogRef; data: Omit<CatalogVehicle, "engine" | "references"> }[];
  references: { vehicle: CatalogRef; data: { source: string; external_id: string } }[];
  existing: { makes: number; models: number; generations: number; engines: number; vehicles: number; references: number };
  /** Existing records to update (per the mode). */
  updates: CatalogUpdate[];
  /** Existing values the file contradicts that are not written (per the mode). */
  differences: string[];
  problems: string[];
};

const blank = (value: unknown) => value == null || value === "";
const show = (value: unknown) => (blank(value) ? "empty" : String(value));

export function planCatalog(
  file: CatalogFile,
  snapshot: CatalogSnapshot,
  options: { mode?: CatalogImportMode } = {},
): CatalogPlan {
  const mode = options.mode ?? "create";
  const plan: CatalogPlan = {
    makes: [],
    models: [],
    generations: [],
    engines: [],
    vehicles: [],
    references: [],
    existing: { makes: 0, models: 0, generations: 0, engines: 0, vehicles: 0, references: 0 },
    updates: [],
    differences: [],
    problems: [],
  };

  /** An existing value the file contradicts: updated or reported, per the mode. */
  const updates = new Map<string, CatalogUpdate>();
  const compare = (entity: CatalogUpdate["entity"], id: string, where: string, field: string, current: unknown, incoming: unknown) => {
    if ((current ?? null) === (incoming ?? null)) return;
    if (mode === "overwrite" || (mode === "fill" && blank(current) && !blank(incoming))) {
      const update = updates.get(id) ?? { entity, id, where, data: {}, changes: [] };
      update.data[field] = incoming ?? null;
      update.changes.push(`${where}: ${field} ${show(current)} → ${show(incoming)}.`);
      if (!updates.has(id)) {
        updates.set(id, update);
        plan.updates.push(update);
      }
    } else {
      plan.differences.push(`${where}: ${field} is ${show(current)}, catalog says ${show(incoming)}.`);
    }
  };

  // Existing records by natural key (ids resolved through their parents).
  const makeName = new Map(snapshot.makes.map((m) => [m.id, m.name]));
  const modelPath = new Map(snapshot.models.map((m) => [m.id, [makeName.get(m.make_id) ?? "", m.name] as const]));
  const makes = new Map(snapshot.makes.map((m) => [makeKey(m.name), m]));
  const models = new Map(snapshot.models.map((m) => [modelKey(makeName.get(m.make_id) ?? "", m.name), m]));
  const generations = new Map(
    snapshot.generations.map((g) => {
      const [make, model] = modelPath.get(g.model_id) ?? ["", ""];
      return [generationKey(make, model, g.name), g];
    }),
  );
  const engines = new Map(snapshot.engines.map((e) => [engineKey(e as any), e]));
  const generationKeyById = new Map([...generations].map(([key, g]) => [g.id, key]));
  const engineKeyById = new Map([...engines].map(([key, e]) => [e.id, key]));
  const vehicles = new Map(
    snapshot.vehicles.map((v) => [vehicleKey(generationKeyById.get(v.generation_id) ?? "", engineKeyById.get(v.engine_id) ?? "", v), v]),
  );
  const references = new Map(snapshot.references.map((r) => [`${r.source}:${r.external_id}`, r]));
  const planned = new Set<string>();

  const engineRef = (engine: CatalogEngine): CatalogRef => {
    const key = engineKey(engine);
    const found = engines.get(key);
    if (found) return { id: found.id };
    if (!planned.has(`engine:${key}`)) {
      planned.add(`engine:${key}`);
      plan.engines.push({ key, data: engine });
    }
    return { key };
  };
  const countedEngines = new Set<string>();

  for (const make of file.makes) {
    const mKey = makeKey(make.name);
    const existingMake = makes.get(mKey);
    if (existingMake) plan.existing.makes++;
    else plan.makes.push({ key: mKey, data: { name: make.name } });
    const makeRef: CatalogRef = existingMake ? { id: existingMake.id } : { key: mKey };

    for (const model of make.models) {
      const moKey = modelKey(make.name, model.name);
      const existingModel = models.get(moKey);
      if (existingModel) {
        plan.existing.models++;
        compare("VehicleModel", existingModel.id, `${make.name} › ${model.name}`, "category", existingModel.category, model.category);
      } else plan.models.push({ key: moKey, make: makeRef, data: { name: model.name, category: model.category } });
      const modelRef: CatalogRef = existingModel ? { id: existingModel.id } : { key: moKey };

      for (const gen of model.generations) {
        const gKey = generationKey(make.name, model.name, gen.name);
        const genPath = `${make.name} › ${model.name} › ${gen.name}`;
        const existingGen = generations.get(gKey);
        if (existingGen) {
          plan.existing.generations++;
          for (const field of ["code", "year_start", "year_end"] as const) {
            compare("VehicleGeneration", existingGen.id, genPath, field, existingGen[field], gen[field]);
          }
        } else {
          plan.generations.push({
            key: gKey,
            model: modelRef,
            data: { name: gen.name, code: gen.code, year_start: gen.year_start, year_end: gen.year_end },
          });
        }
        const genRef: CatalogRef = existingGen ? { id: existingGen.id } : { key: gKey };

        gen.vehicles.forEach((v, i) => {
          const where = `${genPath} › #${i + 1}`;
          const eKey = engineKey(v.engine);
          if (engines.has(eKey) && !countedEngines.has(eKey)) {
            countedEngines.add(eKey);
            plan.existing.engines++;
          }
          const vKey = vehicleKey(gKey, eKey, v);
          const existingVehicle = vehicles.get(vKey);
          const { engine, references: refs, ...data } = v;
          let vehicleRef: CatalogRef;
          if (existingVehicle) {
            plan.existing.vehicles++;
            vehicleRef = { id: existingVehicle.id };
            compare("Vehicle", existingVehicle.id, where, "year_end", existingVehicle.year_end, v.year_end);
            compare("Vehicle", existingVehicle.id, where, "doors", existingVehicle.doors, v.doors);
          } else {
            plan.vehicles.push({ key: vKey, generation: genRef, engine: engineRef(engine), data });
            vehicleRef = { key: vKey };
          }
          for (const ref of refs) {
            const existingRef = references.get(`${ref.source}:${ref.external_id}`);
            if (!existingRef) plan.references.push({ vehicle: vehicleRef, data: ref });
            else if ("id" in vehicleRef && existingRef.vehicle_id === vehicleRef.id) plan.existing.references++;
            else plan.problems.push(`${where}: reference ${ref.source}:${ref.external_id} belongs to another vehicle.`);
          }
        });
      }
    }
  }

  // Updated generation years must still hold their existing configurations.
  for (const update of plan.updates) {
    if (update.entity !== "VehicleGeneration" || !("year_start" in update.data || "year_end" in update.data)) continue;
    const before = snapshot.generations.find((g) => g.id === update.id)!;
    const after = { ...before, ...update.data } as typeof before;
    for (const v of snapshot.vehicles.filter((v) => v.generation_id === update.id)) {
      const end = (updates.get(v.id)?.data.year_end as number | null | undefined) ?? v.year_end;
      const inside = v.year_start >= after.year_start && (after.year_end == null || (end != null && end <= after.year_end));
      if (!inside) {
        plan.problems.push(
          `${update.where}: new years ${after.year_start}–${after.year_end ?? ""} leave a configuration (${v.year_start}–${end ?? ""}) outside.`,
        );
      }
    }
  }
  return plan;
}
