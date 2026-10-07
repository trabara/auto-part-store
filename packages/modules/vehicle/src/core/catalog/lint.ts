// Rules every catalog record is checked against, nightly and for free: what a
// clean catalog never contains (duplicates, implausible values, broken naming
// conventions). Each finding says where, why, and what would fix it; only
// fixes marked `safe` (whitespace) are applied without a person. Pure.
import { CatalogEntityName } from "../../contract/entities/enums";
import { childrenOf } from "./export";

export type FindingSeverity = "error" | "warning" | "info";

export type FindingFix =
  /** Set these fields on the record (`safe`: applied without review). */
  | { kind: "update"; data: Record<string, unknown>; safe?: boolean }
  /** Merge the record into another of the same entity (its users are re-pointed). */
  | { kind: "merge"; into: string };

export type Finding = {
  rule: string;
  severity: FindingSeverity;
  entity: CatalogEntityName;
  id: string;
  /** Stable across runs: the rule and the record(s) it is about. */
  key: string;
  message: string;
  make: string | null;
  model: string | null;
  generation: string | null;
  fix?: FindingFix;
};

/** What the rules read. */
export type LintRecords = {
  makes: { id: string; name: string }[];
  models: { id: string; make_id: string; name: string; category: string }[];
  generations: { id: string; model_id: string; name: string; code: string | null; year_start: number; year_end: number | null }[];
  engines: { id: string; code: string | null; fuel: string; layout: string | null; cylinders: number | null; displacement_cc: number | null; power_kw: number }[];
  vehicles: {
    id: string;
    generation_id: string;
    engine_id: string;
    body_style: string;
    doors: number;
    drive: string;
    transmission: string;
    trim: string | null;
    year_start: number;
    year_end: number | null;
  }[];
  references: { id: string; vehicle_id: string; source: string; external_id: string }[];
};

/** "Citroën C-Elysée " → "citroencelysee": what two spellings of one name share. */
export const nameKey = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const MAKE_ALIASES: Record<string, string> = { mercedes: "mercedesbenz", vw: "volkswagen", chevy: "chevrolet" };
const makeIdentity = (name: string) => MAKE_ALIASES[nameKey(name)] ?? nameKey(name);

/** Names with stray whitespace, tidied. */
const tidy = (value: string) => value.trim().replace(/\s+/g, " ");

/** Words that say a model is commercial (vans, pickups, cabs). */
const COMMERCIAL = /\b(van|vans|pick-?up|cabine?|cab|fourgon|fourgonnette|utilitaire|cargo|truck|camion|chassis|panel|plateau|benne)\b/i;

/** Naming conventions of generations: "III", "Mk7", "2", or a code ("E90"). */
const convention = (name: string) =>
  /^[IVXL]+\b/.test(name) ? "roman" : /^mk\s?\d+/i.test(name) ? "mk" : /^\d+$/.test(name) ? "number" : "code";

type Years = { year_start: number; year_end: number | null };
const span = (r: Years) => `${r.year_start}–${r.year_end ?? ""}`;
const shared = (a: Years, b: Years) => Math.min(a.year_end ?? Infinity, b.year_end ?? Infinity) - Math.max(a.year_start, b.year_start);

export function lintCatalog(records: LintRecords, options: { now?: Date } = {}): Finding[] {
  const thisYear = (options.now ?? new Date()).getFullYear();
  const findings: Finding[] = [];
  const makeById = new Map(records.makes.map((m) => [m.id, m]));
  const modelById = new Map(records.models.map((m) => [m.id, m]));
  const generationById = new Map(records.generations.map((g) => [g.id, g]));
  const engineById = new Map(records.engines.map((e) => [e.id, e]));
  const modelsOf = childrenOf(records.models, "make_id");
  const generationsOf = childrenOf(records.generations, "model_id");
  const vehiclesOf = childrenOf(records.vehicles, "generation_id");
  const vehiclesOfEngine = childrenOf(records.vehicles, "engine_id");

  const where = (generationId?: string, modelId?: string) => {
    const g = generationId ? generationById.get(generationId) : undefined;
    const m = modelById.get(g?.model_id ?? modelId ?? "");
    return { make: m ? (makeById.get(m.make_id)?.name ?? null) : null, model: m?.name ?? null, generation: g?.name ?? null };
  };
  const add = (f: Omit<Finding, "key" | "make" | "model" | "generation"> & { pair?: string; at?: ReturnType<typeof where> }) => {
    const { pair, at, ...finding } = f;
    findings.push({ ...finding, ...(at ?? { make: null, model: null, generation: null }), key: [f.rule, f.id, pair].filter(Boolean).join(":") });
  };

  // ── Makes ──
  const byIdentity = new Map<string, typeof records.makes>();
  for (const make of records.makes) {
    const at = { make: make.name, model: null, generation: null };
    if (tidy(make.name) !== make.name) {
      add({ rule: "make.whitespace", severity: "info", entity: CatalogEntityName.VehicleMake, id: make.id, at, message: `"${make.name}" has stray spaces.`, fix: { kind: "update", data: { name: tidy(make.name) }, safe: true } });
    }
    byIdentity.set(makeIdentity(make.name), [...(byIdentity.get(makeIdentity(make.name)) ?? []), make]);
    if (!modelsOf(make.id).length) {
      add({ rule: "make.no_models", severity: "info", entity: CatalogEntityName.VehicleMake, id: make.id, at, message: `${make.name} has no models.` });
    }
  }
  for (const group of byIdentity.values()) {
    for (const make of group.slice(1)) {
      add({ rule: "make.duplicate", severity: "warning", entity: CatalogEntityName.VehicleMake, id: make.id, pair: group[0]!.id, at: { make: make.name, model: null, generation: null }, message: `"${make.name}" looks like "${group[0]!.name}".` });
    }
  }

  // ── Models ──
  for (const make of records.makes) {
    const seen = new Map<string, (typeof records.models)[number]>();
    for (const model of modelsOf(make.id)) {
      const at = where(undefined, model.id);
      const key = nameKey(model.name);
      const twin = seen.get(key);
      if (twin) {
        add({ rule: "model.duplicate", severity: "warning", entity: CatalogEntityName.VehicleModel, id: model.id, pair: twin.id, at, message: `"${model.name}" looks like "${twin.name}" (${make.name}).` });
      } else seen.set(key, model);
      if (tidy(model.name) !== model.name) {
        add({ rule: "model.whitespace", severity: "info", entity: CatalogEntityName.VehicleModel, id: model.id, at, message: `"${model.name}" has stray spaces.`, fix: { kind: "update", data: { name: tidy(model.name) }, safe: true } });
      }
      const prefix = new RegExp(`^${tidy(make.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
      if (prefix.test(model.name)) {
        add({ rule: "model.name_contains_make", severity: "warning", entity: CatalogEntityName.VehicleModel, id: model.id, at, message: `"${model.name}" repeats the make's name.`, fix: { kind: "update", data: { name: model.name.replace(prefix, "") } } });
      }
      if (model.category === "CAR" && COMMERCIAL.test(model.name)) {
        add({ rule: "model.category", severity: "warning", entity: CatalogEntityName.VehicleModel, id: model.id, at, message: `"${model.name}" sounds commercial but is listed as a car.`, fix: { kind: "update", data: { category: "LCV" } } });
      }
    }
  }

  // ── Generations ──
  for (const model of records.models) {
    const gens = [...generationsOf(model.id)].sort((a, b) => a.year_start - b.year_start);
    const conventions = new Set(gens.map((g) => convention(g.name)).filter((c) => c !== "code"));
    if (conventions.size > 1) {
      add({ rule: "generation.naming", severity: "info", entity: CatalogEntityName.VehicleModel, id: model.id, at: where(undefined, model.id), message: `Generations of ${model.name} mix naming conventions (${gens.map((g) => g.name).join(", ")}).` });
    }
    gens.forEach((g, i) => {
      const at = where(g.id);
      if (g.year_start > thisYear + 1) {
        add({ rule: "generation.future", severity: "error", entity: CatalogEntityName.VehicleGeneration, id: g.id, at, message: `${g.name} starts in ${g.year_start}.` });
      }
      if (g.year_end == null && g.year_start < thisYear - 10) {
        add({ rule: "generation.ongoing_long", severity: "warning", entity: CatalogEntityName.VehicleGeneration, id: g.id, at, message: `${g.name} is listed as produced since ${g.year_start}: has it ended?` });
      }
      if (tidy(g.name) !== g.name) {
        add({ rule: "generation.whitespace", severity: "info", entity: CatalogEntityName.VehicleGeneration, id: g.id, at, message: `"${g.name}" has stray spaces.`, fix: { kind: "update", data: { name: tidy(g.name) }, safe: true } });
      }
      for (const other of gens.slice(0, i)) {
        if (shared(g, other) > 1) {
          add({ rule: "generation.overlap", severity: "warning", entity: CatalogEntityName.VehicleGeneration, id: g.id, pair: other.id, at, message: `${g.name} (${span(g)}) overlaps ${other.name} (${span(other)}): one generation under two names?`, fix: { kind: "merge", into: other.id } });
        }
        if (g.code && other.code && nameKey(g.code) === nameKey(other.code)) {
          add({ rule: "generation.duplicate_code", severity: "warning", entity: CatalogEntityName.VehicleGeneration, id: g.id, pair: other.id, at, message: `${g.name} and ${other.name} share the code ${g.code}.` });
        }
      }
      const next = gens[i + 1];
      if (next && g.year_end != null && next.year_start - g.year_end > 3) {
        add({ rule: "generation.gap", severity: "info", entity: CatalogEntityName.VehicleGeneration, id: g.id, pair: next.id, at, message: `Nothing between ${g.name} (ends ${g.year_end}) and ${next.name} (starts ${next.year_start}): a missing generation?` });
      }
    });
  }

  // ── Engines ──
  const bySpec = new Map<string, typeof records.engines>();
  for (const e of records.engines) {
    const at = { make: null, model: null, generation: null };
    const spec = [e.fuel, e.layout ?? "", e.cylinders ?? "", e.displacement_cc ?? "", e.power_kw].join("|");
    bySpec.set(spec, [...(bySpec.get(spec) ?? []), e]);
    const electric = e.fuel === "ELECTRIC";
    if (electric && (e.displacement_cc || e.cylinders)) {
      add({ rule: "engine.electric_fields", severity: "warning", entity: CatalogEntityName.VehicleEngine, id: e.id, at, message: `Electric engine ${e.power_kw} kW lists a displacement or cylinders.`, fix: { kind: "update", data: { displacement_cc: null, cylinders: null } } });
    }
    if (!electric && e.displacement_cc) {
      const perLitre = e.power_kw / (e.displacement_cc / 1000);
      if (perLitre > 160 || perLitre < 15) {
        add({ rule: "engine.specific_output", severity: "warning", entity: CatalogEntityName.VehicleEngine, id: e.id, at, message: `${e.power_kw} kW from ${e.displacement_cc} cm³ (${Math.round(perLitre)} kW/L) is implausible.` });
      }
      if (e.cylinders) {
        const perCylinder = e.displacement_cc / e.cylinders;
        if (perCylinder < 100 || perCylinder > 1100) {
          add({ rule: "engine.cylinder_size", severity: "warning", entity: CatalogEntityName.VehicleEngine, id: e.id, at, message: `${e.displacement_cc} cm³ over ${e.cylinders} cylinders (${Math.round(perCylinder)} cm³ each) is implausible.` });
        }
      }
    }
    if (!vehiclesOfEngine(e.id).length) {
      add({ rule: "engine.unused", severity: "info", entity: CatalogEntityName.VehicleEngine, id: e.id, at, message: `Engine ${e.code ?? ""} ${e.power_kw} kW is used by no configuration.`.replace("  ", " ") });
    }
  }
  for (const group of bySpec.values()) {
    const coded = group.filter((e) => e.code);
    for (const e of group.filter((x) => !x.code)) {
      if (coded.length === 1) {
        add({ rule: "engine.duplicate", severity: "warning", entity: CatalogEntityName.VehicleEngine, id: e.id, pair: coded[0]!.id, at: { make: null, model: null, generation: null }, message: `Engine ${e.power_kw} kW without a code duplicates ${coded[0]!.code}.`, fix: { kind: "merge", into: coded[0]!.id } });
      }
    }
  }

  // ── Configurations ──
  for (const g of records.generations) {
    const vehicles = vehiclesOf(g.id);
    const model = modelById.get(g.model_id);
    vehicles.forEach((v, i) => {
      const at = where(g.id);
      const engine = engineById.get(v.engine_id);
      const label = `${engine ? `${engine.power_kw} kW ` : ""}${v.body_style.toLowerCase()} ${span(v)}`;
      const inside = v.year_start >= g.year_start && (g.year_end == null || (v.year_end != null && v.year_end <= g.year_end));
      if (!inside) {
        add({ rule: "vehicle.outside_generation", severity: "error", entity: CatalogEntityName.Vehicle, id: v.id, at, message: `${label} falls outside ${g.name} (${span(g)}).` });
      }
      if (v.year_start > thisYear + 1) {
        add({ rule: "vehicle.future", severity: "error", entity: CatalogEntityName.Vehicle, id: v.id, at, message: `${label} starts in ${v.year_start}.` });
      }
      if (engine?.fuel === "ELECTRIC" && v.transmission === "MANUAL") {
        add({ rule: "vehicle.electric_manual", severity: "warning", entity: CatalogEntityName.Vehicle, id: v.id, at, message: `Electric ${label} with a manual gearbox.`, fix: { kind: "update", data: { transmission: "AUTOMATIC" } } });
      }
      if ((v.body_style === "COUPE" || v.body_style === "CONVERTIBLE") && v.doors >= 5) {
        add({ rule: "vehicle.doors_body", severity: "info", entity: CatalogEntityName.Vehicle, id: v.id, at, message: `${label} with ${v.doors} doors.` });
      }
      if (model?.category === "CAR" && v.drive === "FOUR_WD") {
        add({ rule: "vehicle.drive_category", severity: "info", entity: CatalogEntityName.Vehicle, id: v.id, at, message: `${label}: a car with 4×4 (part-time) drive; all-wheel drive?`, fix: { kind: "update", data: { drive: "AWD" } } });
      }
      for (const other of vehicles.slice(0, i)) {
        const otherEngine = engineById.get(other.engine_id);
        const sameShape = other.body_style === v.body_style && other.doors === v.doors && other.drive === v.drive && other.transmission === v.transmission;
        if (sameShape && engine && otherEngine && engine.fuel === otherEngine.fuel && engine.power_kw === otherEngine.power_kw && shared(v, other) >= 0) {
          if (other.engine_id !== v.engine_id || (other.trim ?? "") !== (v.trim ?? "")) {
            add({ rule: "vehicle.near_duplicate", severity: "warning", entity: CatalogEntityName.Vehicle, id: v.id, pair: other.id, at, message: `${label} looks like another configuration (${span(other)}), described differently.`, fix: { kind: "merge", into: other.id } });
          }
        }
      }
    });
  }

  // ── References ──
  for (const r of records.references) {
    if (r.source === "TECDOC_KTYPE" && !/^\d+$/.test(r.external_id)) {
      add({ rule: "reference.format", severity: "error", entity: CatalogEntityName.VehicleReference, id: r.id, at: { make: null, model: null, generation: null }, message: `TecDoc K-type "${r.external_id}" is not a number.` });
    }
  }
  return findings;
}
