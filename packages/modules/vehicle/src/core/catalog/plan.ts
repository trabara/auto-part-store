// What importing a catalog file would change, given what exists: records to
// create (in dependency order, with references to existing ids or to records
// created earlier in the plan), records that exist, and existing values the
// file contradicts. The mode decides what happens to those: `create` reports
// them, `fill` writes the file's value only where the record has none (e.g. a
// missing code, or an end year for a generation still listed as current),
// `merge` also replaces values of a lower trust tier (never a staff edit), and
// `overwrite` writes them all (for reviewed files).
//
// Provenance: created records take the file's tier and source; records the
// file matches without contradiction ("touched") and updated records get the
// source appended, `verified_at` and the higher of the two tiers.
import type { CatalogEngine, CatalogFile, CatalogImportMode, CatalogVehicle } from "../../contract/catalog";
import { SourceTier } from "../../contract/entities/enums";
import type { SourceRef } from "../../contract/entities/shared";
import { childrenOf } from "./export";
import { sameEngine } from "./lint";
import { engineKey, generationKey, makeKey, modelKey, vehicleKey } from "./keys";
import { higherTier, mayFill, mayOverwrite, mergeSources } from "./trust";

/** An existing record (`id`) or one the plan creates (`key`). */
export type CatalogRef = { id: string } | { key: string };

/** A record's provenance, as stored (optional in snapshots built by hand). */
type Provenance = { source_tier?: string | null; sources?: SourceRef[] | null; verified_at?: Date | string | null };

/** The records of the vehicle module an import needs to know about. */
export type CatalogSnapshot = {
  makes: ({ id: string; name: string } & Provenance)[];
  models: ({ id: string; make_id: string; name: string; category: string } & Provenance)[];
  generations: ({ id: string; model_id: string; name: string; code: string | null; year_start: number; year_end: number | null } & Provenance)[];
  engines: ({ id: string; code: string | null; fuel: string; layout: string | null; cylinders: number | null; displacement_cc: number | null; power_kw: number } & Provenance)[];
  vehicles: (Provenance & {
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
  })[];
  references: { source: string; external_id: string; vehicle_id: string }[];
};

/** Provenance to write on a record (created, updated or touched). */
export type ProvenancePatch = { source_tier: SourceTier; sources: SourceRef[]; verified_at: Date | null };

/** The catalog entities an import writes provenance on. */
export type CatalogRecordEntity = "VehicleMake" | "VehicleModel" | "VehicleGeneration" | "VehicleEngine" | "Vehicle";

/** Fields of an existing record to update, and why (one line per field). */
export type CatalogUpdate = {
  entity: "VehicleModel" | "VehicleGeneration" | "Vehicle";
  id: string;
  /** The record, as a path (Make › Model › Generation › #n). */
  where: string;
  data: Record<string, unknown>;
  changes: string[];
  /** The updated record's new provenance (the file is a source of its new values). */
  provenance?: ProvenancePatch;
};

/** An existing record the file confirmed: provenance to stamp. */
export type CatalogTouch = { entity: CatalogRecordEntity; id: string; provenance: ProvenancePatch };

export type CatalogPlan = {
  makes: { key: string; data: { name: string }; provenance: ProvenancePatch }[];
  models: { key: string; make: CatalogRef; data: { name: string; category: string }; provenance: ProvenancePatch }[];
  generations: {
    key: string;
    model: CatalogRef;
    data: { name: string; code: string | null; year_start: number; year_end: number | null };
    provenance: ProvenancePatch;
  }[];
  engines: { key: string; data: CatalogEngine; provenance: ProvenancePatch }[];
  vehicles: {
    key: string;
    generation: CatalogRef;
    engine: CatalogRef;
    data: Omit<CatalogVehicle, "engine" | "references">;
    provenance: ProvenancePatch;
  }[];
  references: { vehicle: CatalogRef; data: { source: string; external_id: string } }[];
  existing: { makes: number; models: number; generations: number; engines: number; vehicles: number; references: number };
  /** Existing records to update (per the mode). */
  updates: CatalogUpdate[];
  /** Existing records the file confirmed, to stamp. */
  touches: CatalogTouch[];
  /** Existing values the file contradicts that are not written (per the mode). */
  differences: string[];
  /** Likely duplicates of existing records (a renamed generation, the same engine described differently): worth a review. */
  warnings: string[];
  problems: string[];
};

const blank = (value: unknown) => value == null || value === "";
const show = (value: unknown) => (blank(value) ? "empty" : String(value));
type Years = { year_start: number; year_end: number | null };
const years = (r: Years) => `${r.year_start}–${r.year_end ?? ""}`;
/** Years two ranges share (Infinity when both are ongoing; negative when apart). */
const sharedYears = (a: Years, b: Years) =>
  Math.min(a.year_end ?? Infinity, b.year_end ?? Infinity) - Math.max(a.year_start, b.year_start);
const inside = (inner: Years, outer: Years) =>
  inner.year_start >= outer.year_start &&
  (outer.year_end == null || (inner.year_end != null && inner.year_end <= outer.year_end));

export function planCatalog(
  file: CatalogFile,
  snapshot: CatalogSnapshot,
  options: { mode?: CatalogImportMode; now?: Date; touch?: boolean } = {},
): CatalogPlan {
  const mode = options.mode ?? "create";
  const now = options.now ?? new Date();
  const tier = (file.source.tier ?? SourceTier.RESEARCH) as SourceTier;
  /** The file as a source, citing the most specific URL (generation, model, or the file's). */
  const sourceRef = (url?: string | null): SourceRef => ({
    name: file.source.name,
    url: url ?? file.source.url ?? null,
    tier,
    at: file.source.retrieved_at ?? now.toISOString().slice(0, 10),
  });
  // An unreviewed bulk (draft) file is no verification: its records stay due.
  const verifies = tier !== SourceTier.DRAFT;
  const created = (url?: string | null): ProvenancePatch => ({ source_tier: tier, sources: [sourceRef(url)], verified_at: verifies ? now : null });
  const stamped = (record: Provenance, url?: string | null): ProvenancePatch => ({
    source_tier: higherTier(record.source_tier, tier),
    sources: mergeSources(record.sources, sourceRef(url)),
    verified_at: verifies ? now : record.verified_at ? new Date(record.verified_at) : null,
  });
  const plan: CatalogPlan = {
    makes: [],
    models: [],
    generations: [],
    engines: [],
    vehicles: [],
    references: [],
    existing: { makes: 0, models: 0, generations: 0, engines: 0, vehicles: 0, references: 0 },
    updates: [],
    touches: [],
    differences: [],
    warnings: [],
    problems: [],
  };

  /** An existing value the file contradicts: updated or reported, per the mode. */
  const updates = new Map<string, CatalogUpdate>();
  /** Records with a contradiction left in place: not confirmed by this file. */
  const contradicted = new Set<string>();
  const compare = (
    entity: CatalogUpdate["entity"],
    id: string,
    where: string,
    field: string,
    current: unknown,
    incoming: unknown,
    recordTier?: string | null,
  ) => {
    // A blank value says nothing (omitted, or unknown to the source): the catalog's stays.
    if (blank(incoming) || current === incoming) return;
    const write =
      mode === "overwrite" ||
      (mode === "fill" && blank(current) && recordTier !== SourceTier.HUMAN) ||
      (mode === "merge" && ((blank(current) && mayFill(recordTier, tier, field)) || mayOverwrite(recordTier, tier)));
    if (write) {
      const update = updates.get(id) ?? { entity, id, where, data: {}, changes: [] };
      update.data[field] = incoming ?? null;
      update.changes.push(`${where}: ${field} ${show(current)} → ${show(incoming)}.`);
      if (!updates.has(id)) {
        updates.set(id, update);
        plan.updates.push(update);
      }
    } else {
      contradicted.add(id);
      plan.differences.push(`${where}: ${field} is ${show(current)}, catalog says ${show(incoming)}.`);
    }
  };
  /** Matched records, with the URL they are confirmed by (stamped unless contradicted). */
  const matched = new Map<string, { entity: CatalogRecordEntity; record: Provenance; url?: string | null }>();
  const match = (entity: CatalogRecordEntity, record: Provenance & { id: string }, url?: string | null) => {
    if (!matched.has(record.id)) matched.set(record.id, { entity, record, url });
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

  let engineUrl: string | null | undefined;
  const engineRef = (engine: CatalogEngine): CatalogRef => {
    const key = engineKey(engine);
    const found = engines.get(key);
    if (found) return { id: found.id };
    if (!planned.has(`engine:${key}`)) {
      planned.add(`engine:${key}`);
      plan.engines.push({ key, data: engine, provenance: created(engineUrl) });
    }
    return { key };
  };
  const countedEngines = new Set<string>();
  const engineById = new Map(snapshot.engines.map((e) => [e.id, e]));
  const vehiclesOf = childrenOf(snapshot.vehicles, "generation_id");
  const generationsOf = childrenOf(snapshot.generations, "model_id");
  const vehicleById = new Map(snapshot.vehicles.map((v) => [v.id, v]));
  const generationById = new Map(snapshot.generations.map((g) => [g.id, g]));
  const norm = (value: string | null) => (value ?? "").trim().toLowerCase();

  /** A new configuration of an existing generation, against what the catalog holds. */
  const checkAgainstCatalog = (
    existingGen: CatalogSnapshot["generations"][number],
    fileGen: Years,
    v: CatalogVehicle,
    where: string,
  ) => {
    // The generation's years as they will be (updates applied), when the file disagrees.
    const effective = { ...existingGen, ...(updates.get(existingGen.id)?.data ?? {}) } as Years;
    const differs = effective.year_start !== fileGen.year_start || (effective.year_end ?? null) !== (fileGen.year_end ?? null);
    if (differs && !inside(v, effective)) {
      plan.problems.push(`${where}: years ${years(v)} fall outside the catalog's generation (${years(effective)}).`);
    }
    const existingEngine = engines.get(engineKey(v.engine));
    for (const other of vehiclesOf(existingGen.id)) {
      if (sharedYears(v, other) < 0) continue;
      const sameShape =
        other.body_style === v.body_style && other.doors === v.doors && other.drive === v.drive && other.transmission === v.transmission;
      if (!sameShape) continue;
      // The database refuses two identical configurations with overlapping years.
      if (existingEngine && other.engine_id === existingEngine.id && norm(other.trim) === norm(v.trim)) {
        plan.problems.push(`${where}: overlaps an existing identical configuration (${years(other)}); use its first year to match it.`);
        continue;
      }
      const otherEngine = engineById.get(other.engine_id);
      if (otherEngine && norm(other.trim) === norm(v.trim) && sameEngine(otherEngine, v.engine)) {
        const described = [otherEngine.code, otherEngine.displacement_cc && `${otherEngine.displacement_cc} cm³`, other.trim].filter(Boolean).join(", ");
        plan.warnings.push(
          `${where}: may duplicate an existing configuration (${v.engine.fuel} ${v.engine.power_kw} kW${described ? `, ${described}` : ""}, ${years(other)}); copy its values to match it.`,
        );
      }
    }
  };

  for (const make of file.makes) {
    const mKey = makeKey(make.name);
    const existingMake = makes.get(mKey);
    if (existingMake) {
      plan.existing.makes++;
      match("VehicleMake", existingMake, make.source);
    } else plan.makes.push({ key: mKey, data: { name: make.name }, provenance: created(make.source) });
    const makeRef: CatalogRef = existingMake ? { id: existingMake.id } : { key: mKey };

    for (const model of make.models) {
      const moKey = modelKey(make.name, model.name);
      const existingModel = models.get(moKey);
      const modelUrl = model.source ?? make.source;
      if (existingModel) {
        plan.existing.models++;
        match("VehicleModel", existingModel, modelUrl);
        compare("VehicleModel", existingModel.id, `${make.name} › ${model.name}`, "category", existingModel.category, model.category, existingModel.source_tier);
      } else {
        plan.models.push({ key: moKey, make: makeRef, data: { name: model.name, category: model.category ?? "CAR" }, provenance: created(modelUrl) });
      }
      const modelRef: CatalogRef = existingModel ? { id: existingModel.id } : { key: moKey };

      for (const gen of model.generations) {
        const gKey = generationKey(make.name, model.name, gen.name);
        const genPath = `${make.name} › ${model.name} › ${gen.name}`;
        const existingGen = generations.get(gKey);
        const genUrl = gen.source ?? modelUrl;
        engineUrl = genUrl;
        if (existingGen) {
          plan.existing.generations++;
          match("VehicleGeneration", existingGen, genUrl);
          for (const field of ["code", "year_start", "year_end"] as const) {
            compare("VehicleGeneration", existingGen.id, genPath, field, existingGen[field], gen[field], existingGen.source_tier);
          }
        } else {
          for (const other of existingModel ? generationsOf(existingModel.id) : []) {
            if (sharedYears(gen, other) > 1) {
              plan.warnings.push(`${genPath}: new generation (${years(gen)}) overlaps existing "${other.name}" (${years(other)}): the same generation under another name?`);
            }
          }
          plan.generations.push({
            key: gKey,
            model: modelRef,
            data: { name: gen.name, code: gen.code, year_start: gen.year_start, year_end: gen.year_end },
            provenance: created(genUrl),
          });
        }
        const genRef: CatalogRef = existingGen ? { id: existingGen.id } : { key: gKey };

        gen.vehicles.forEach((v, i) => {
          const where = `${genPath} › #${i + 1}`;
          const eKey = engineKey(v.engine);
          const existingEngine = engines.get(eKey);
          if (existingEngine) {
            match("VehicleEngine", existingEngine, genUrl);
            if (!countedEngines.has(eKey)) {
              countedEngines.add(eKey);
              plan.existing.engines++;
            }
          }
          const vKey = vehicleKey(gKey, eKey, v);
          const existingVehicle = vehicles.get(vKey);
          const { engine, references: refs, ...data } = v;
          let vehicleRef: CatalogRef;
          if (existingVehicle) {
            plan.existing.vehicles++;
            vehicleRef = { id: existingVehicle.id };
            match("Vehicle", existingVehicle, genUrl);
            compare("Vehicle", existingVehicle.id, where, "year_end", existingVehicle.year_end, v.year_end, existingVehicle.source_tier);
          } else {
            if (existingGen) checkAgainstCatalog(existingGen, gen, v, where);
            plan.vehicles.push({ key: vKey, generation: genRef, engine: engineRef(engine), data, provenance: created(genUrl) });
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

  // Provenance: updated records take the file as a source of their new values;
  // matched records it doesn't contradict are confirmed by it.
  for (const update of plan.updates) {
    const m = matched.get(update.id);
    if (m) update.provenance = stamped(m.record, m.url);
  }
  for (const [id, m] of matched) {
    // `touch: false`: the file only adds records (e.g. what a verification found missing).
    if (options.touch === false || contradicted.has(id) || updates.has(id)) continue;
    plan.touches.push({ entity: m.entity, id, provenance: stamped(m.record, m.url) });
  }

  // Updated configuration years must fit their generation's (as it will be).
  for (const update of plan.updates) {
    if (update.entity !== "Vehicle") continue;
    const before = vehicleById.get(update.id)!;
    const gen = generationById.get(before.generation_id);
    if (!gen) continue;
    const vehicle = { ...before, ...update.data } as Years;
    const generation = { ...gen, ...(updates.get(gen.id)?.data ?? {}) } as Years;
    if (!inside(vehicle, generation)) {
      plan.problems.push(`${update.where}: years ${years(vehicle)} would fall outside the generation (${years(generation)}).`);
    }
  }

  // Updated generation years must still hold their existing configurations.
  for (const update of plan.updates) {
    if (update.entity !== "VehicleGeneration" || !("year_start" in update.data || "year_end" in update.data)) continue;
    const before = generationById.get(update.id)!;
    const after = { ...before, ...update.data } as typeof before;
    for (const v of vehiclesOf(update.id)) {
      const vehicle = { ...v, ...(updates.get(v.id)?.data ?? {}) } as Years;
      if (!inside(vehicle, after)) {
        plan.problems.push(`${update.where}: new years ${years(after)} leave a configuration (${years(vehicle)}) outside.`);
      }
    }
  }
  return plan;
}
