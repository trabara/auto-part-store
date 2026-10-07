// The catalog steward's side of a language-model call: what the model is
// asked (a compact prompt and a JSON schema for one focused task), and what
// its answer becomes (catalog changes) once checked. Built for small local
// models: values are copied as written with their units (the conversion is
// done here), records are referred to by short refs (g1, c1, e1), every item
// carries a verbatim quote that must be found in the evidence, and for
// verification the model only reports what the source says: the comparison
// with the catalog is done here. Pure.
import { z } from "@medusajs/framework/zod";
import type { CatalogFile, CatalogGeneration, CatalogVehicle } from "../../contract/catalog";
import {
  BodyStyle,
  CatalogTaskKind,
  Drive,
  EngineLayout,
  FuelType,
  SourceTier,
  Transmission,
} from "../../contract/entities/enums";
import { mayFill, mayOverwrite } from "./trust";
import { displacementToCc, powerToKw } from "./units";

// ── Context ───────────────────────────────────────────────────────────────────

type Tiered = { source_tier: string };
export type StewardGeneration = Tiered & {
  id: string;
  name: string;
  code: string | null;
  year_start: number;
  year_end: number | null;
  configurations?: number;
};
export type StewardEngine = Tiered & {
  id: string;
  code: string | null;
  fuel: string;
  layout: string | null;
  cylinders: number | null;
  displacement_cc: number | null;
  power_kw: number;
};
export type StewardVehicle = Tiered & {
  id: string;
  engine_id: string;
  body_style: string;
  doors: number;
  drive: string;
  transmission: string;
  trim: string | null;
  year_start: number;
  year_end: number | null;
};

/** What a task is about, as the catalog has it. */
export type StewardContext = {
  kind: CatalogTaskKind;
  feedback?: string | null;
  make: { id: string; name: string };
  model: Tiered & { id: string; name: string; category: string };
  /** All the model's generations, oldest first. */
  generations: StewardGeneration[];
  /** The task's generation (configurations, generation verification). */
  generation?: StewardGeneration;
  /** Its configurations and their engines. */
  vehicles?: StewardVehicle[];
  engines?: StewardEngine[];
};

/** Short refs the model sees instead of ids, in a stable order. */
export function refs(ctx: StewardContext) {
  const generations = new Map(ctx.generations.map((g, i) => [`g${i + 1}`, g]));
  const vehicles = new Map((ctx.vehicles ?? []).map((v, i) => [`c${i + 1}`, v]));
  const engines = new Map((ctx.engines ?? []).map((e, i) => [`e${i + 1}`, e]));
  return { generations, vehicles, engines };
}

// ── Output schemas (what the model answers) ───────────────────────────────────

const quote = z.string().describe("Verbatim excerpt of the evidence (copied, at most 200 characters) containing the item's numbers");
const year = z.number().int();
const POWER_UNITS = ["kW", "ch", "PS", "CV", "hp", "bhp"] as const;
const CC_UNITS = ["cm3", "cc", "L"] as const;

const generationFound = z.object({
  name: z.string().describe("As the evidence names it, e.g. 'III', 'Mk7', 'third generation'"),
  code: z.string().nullable().describe("Chassis or platform code, e.g. 'BF', '5G'; null when not given"),
  from: year.describe("First production year"),
  to: year.nullable().describe("Last production year; null while still produced"),
  quote,
});

const versionFound = z.object({
  engine_code: z.string().nullable().describe("Manufacturer engine code, e.g. 'K9K'; null when not given"),
  fuel: z.enum(FuelType),
  power: z.number().describe("Power exactly as written"),
  power_unit: z.enum(POWER_UNITS),
  displacement: z.number().nullable().describe("Displacement exactly as written; null when not given"),
  displacement_unit: z.enum(CC_UNITS).nullable(),
  cylinders: z.number().int().nullable(),
  layout: z.enum(EngineLayout).nullable(),
  body: z.enum(BodyStyle),
  doors: z.number().int(),
  drive: z.enum(Drive),
  gearbox: z.enum(Transmission),
  trim: z.string().nullable().describe("Only when it changes the specification"),
  from: year,
  to: year.nullable(),
  assumed: z.boolean().describe("true when body, doors, drive or gearbox are not stated for this version"),
  quote,
});

export const GenerationsOutput = z.object({ generations: z.array(generationFound), notes: z.string() });
export const ConfigurationsOutput = z.object({
  generation: z.object({ code: z.string().nullable(), from: year.nullable(), to: year.nullable(), quote: z.string().nullable() }),
  configurations: z.array(versionFound),
  notes: z.string(),
});
export const ModelVerificationOutput = z.object({
  generations: z.array(
    z.object({
      ref: z.string().describe("g1, g2…"),
      found: z.boolean(),
      code: z.string().nullable(),
      from: year.nullable(),
      to: year.nullable(),
      quote: z.string().nullable(),
    }),
  ),
  missing: z.array(generationFound).describe("Generations in the evidence that the catalog lacks"),
  notes: z.string(),
});
export const GenerationVerificationOutput = z.object({
  configurations: z.array(
    z.object({ ref: z.string().describe("c1, c2…"), found: z.boolean(), from: year.nullable(), to: year.nullable(), quote: z.string().nullable() }),
  ),
  engines: z.array(
    z.object({
      ref: z.string().describe("e1, e2…"),
      found: z.boolean(),
      power: z.number().nullable(),
      power_unit: z.enum(POWER_UNITS).nullable(),
      displacement: z.number().nullable(),
      displacement_unit: z.enum(CC_UNITS).nullable(),
      quote: z.string().nullable(),
    }),
  ),
  missing: z.array(versionFound).describe("Versions in the evidence that the catalog lacks"),
  notes: z.string(),
});

const OUTPUTS = {
  [CatalogTaskKind.RESEARCH_GENERATIONS]: GenerationsOutput,
  [CatalogTaskKind.RESEARCH_CONFIGURATIONS]: ConfigurationsOutput,
  [CatalogTaskKind.VERIFY_MODEL]: ModelVerificationOutput,
  [CatalogTaskKind.VERIFY_GENERATION]: GenerationVerificationOutput,
} as const;
type ModelKind = keyof typeof OUTPUTS;
export type StewardOutput<K extends ModelKind = ModelKind> = z.infer<(typeof OUTPUTS)[K]>;

/** The JSON schema a model's answer must follow for a task kind (Ollama `format`, OpenAI `response_format`). */
export function outputSchema(kind: CatalogTaskKind): Record<string, unknown> {
  const schema = OUTPUTS[kind as ModelKind];
  if (!schema) throw new Error(`No model output for ${kind} tasks`);
  const { $schema, ...json } = z.toJSONSchema(schema) as Record<string, unknown>;
  return json;
}

/** Parses a model's answer (an object or JSON text) for a task kind; null when it doesn't match. */
export function parseOutput<K extends ModelKind>(kind: K, raw: unknown): StewardOutput<K> | null {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch {
      return null;
    }
  }
  const parsed = OUTPUTS[kind].safeParse(value);
  return parsed.success ? (parsed.data as StewardOutput<K>) : null;
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const SYSTEM = [
  "You extract vehicle catalog facts from the EVIDENCE only.",
  "1. Use only the evidence. When something is not in it, leave it out or use null.",
  "2. Copy numbers exactly as written, with their unit (85 ch, 1.5 L, 63 kW). Never convert or compute.",
  "3. Each item's quote is a short verbatim excerpt of the evidence (copy it, at most 200 characters) that contains the item's numbers.",
  "4. Answer with JSON only, following the schema.",
].join("\n");

const span = (r: { year_start: number; year_end: number | null }) => `${r.year_start}–${r.year_end ?? "present"}`;
const engineText = (e: StewardEngine) =>
  [e.fuel, e.layout, e.cylinders && `${e.cylinders} cyl`, e.displacement_cc && `${e.displacement_cc} cm3`, `${e.power_kw} kW`, e.code && `code ${e.code}`]
    .filter(Boolean)
    .join(" ");

export type PromptEvidence = { url: string; text: string };
export type StewardPrompt = { messages: { role: "system" | "user"; content: string }[]; schema: Record<string, unknown> };

/** The messages and schema for a task: the catalog's side, then the evidence. */
export function buildPrompt(ctx: StewardContext, evidence: PromptEvidence[]): StewardPrompt {
  const r = refs(ctx);
  const head = `Vehicle: ${ctx.make.name} ${ctx.model.name} (${ctx.model.category === "LCV" ? "light commercial" : ctx.model.category.toLowerCase()})`;
  const gen = ctx.generation;
  const genText = (g: StewardGeneration) => `"${g.name}"${g.code ? ` (${g.code})` : ""}, ${span(g)}`;
  const lines: string[] = [head];
  switch (ctx.kind) {
    case CatalogTaskKind.RESEARCH_GENERATIONS:
      lines.push("Task: list this model's generations (production series) found in the evidence: name as written, chassis or platform code, first and last production year (to: null while still produced).");
      break;
    case CatalogTaskKind.RESEARCH_CONFIGURATIONS:
      lines.push(
        `Generation: ${genText(gen!)}.`,
        `Other generations: ${ctx.generations.filter((g) => g.id !== gen!.id).map(genText).join("; ") || "none"}.`,
        "Task: list this generation's versions found in the evidence: engine (code, fuel, power with its unit, displacement with its unit, cylinders, layout), body style and doors, drive, gearbox, trim (only when it changes the specification), production years.",
        "When the evidence does not state body, doors, drive or gearbox for a version, use the generation's usual values and set assumed: true.",
        "If the evidence corrects the generation's code or years, give them under generation, with a quote.",
      );
      if (ctx.vehicles?.length) {
        lines.push("Already in the catalog (do not repeat them):", ...ctx.vehicles.map((v) => `- ${vehicleText(ctx, v)}`));
      }
      break;
    case CatalogTaskKind.VERIFY_MODEL:
      lines.push(
        "The catalog lists these generations:",
        ...[...r.generations].map(([ref, g]) => `${ref}: ${genText(g)}`),
        "Task: for each ref, say whether the evidence describes it (found) and give its code, first and last year as the evidence writes them, with a quote. Under missing, list generations of the evidence the catalog lacks.",
      );
      break;
    case CatalogTaskKind.VERIFY_GENERATION:
      lines.push(
        `Generation: ${genText(gen!)}.`,
        "The catalog lists these configurations:",
        ...[...r.vehicles].map(([ref, v]) => `${ref}: ${vehicleText(ctx, v)}`),
        "and these engines:",
        ...[...r.engines].map(([ref, e]) => `${ref}: ${engineText(e)}`),
        "Task: for each configuration ref, say whether the evidence mentions it (found) with its years and a quote. For each engine ref, give its power and displacement exactly as written, with a quote. Under missing, list versions of the evidence the catalog lacks.",
      );
      break;
    default:
      throw new Error(`No prompt for ${ctx.kind} tasks`);
  }
  if (ctx.feedback) lines.push(`A reviewer noted: ${ctx.feedback}`);
  for (const e of evidence) lines.push("", `EVIDENCE (source: ${e.url})`, e.text);
  return {
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: lines.join("\n") },
    ],
    schema: outputSchema(ctx.kind),
  };
}

function vehicleText(ctx: StewardContext, v: StewardVehicle) {
  const e = ctx.engines?.find((x) => x.id === v.engine_id);
  return [e ? engineText(e) : "", `${v.body_style.toLowerCase()} ${v.doors} doors`, v.drive, v.transmission.toLowerCase(), v.trim ? `trim ${v.trim}` : "", span(v)]
    .filter(Boolean)
    .join(", ");
}

// ── Quotes ────────────────────────────────────────────────────────────────────

/** Text as compared for quotes: accents, case, markup, dash and digit-grouping differences removed. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[‐-―−]/g, "-")
    .replace(/[|*_`#>[\]()]/g, " ")
    .replace(/[   ]/g, " ")
    .replace(/(\d) (?=\d{3}\b)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole numbers a text mentions ("1.5 L", "1 461 cm3" → 1.5, 1461). */
export const numbersIn = (text: string) =>
  (normalizeText(text).match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(",", ".")));

/**
 * A quote supports a claim when it is found in the evidence (each part, if
 * elided with "…") and mentions one of the claim's numbers (when given).
 */
export function quoteSupports(evidence: string, quoteText: string | null | undefined, anyOf: (number | null | undefined)[] = []): boolean {
  if (!quoteText) return false;
  const doc = normalizeText(evidence);
  const parts = quoteText.split(/\.\.\.|…/).map(normalizeText).filter((p) => p.length >= 6);
  if (!parts.length || !parts.every((p) => doc.includes(p))) return false;
  const wanted = anyOf.filter((n): n is number => n != null && Number.isFinite(n));
  if (!wanted.length) return true;
  const mentioned = numbersIn(quoteText);
  return wanted.some((n) => mentioned.some((m) => Math.abs(m - n) < 1e-9));
}

// ── Answers to catalog changes ────────────────────────────────────────────────

const ORDINALS: Record<string, string> = {
  first: "I", second: "II", third: "III", fourth: "IV", fifth: "V", sixth: "VI", seventh: "VII", eighth: "VIII", ninth: "IX", tenth: "X",
  premiere: "I", deuxieme: "II", troisieme: "III", quatrieme: "IV", cinquieme: "V", sixieme: "VI", septieme: "VII", huitieme: "VIII", neuvieme: "IX", dixieme: "X",
};
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/**
 * A generation name in the catalog's convention: "Third generation" → "III",
 * "Clio IV" → "IV", "2nd gen" → "II"; "Mk7" and codes stay as written.
 */
export function generationName(raw: string, model: string): string {
  let name = raw.trim().replace(new RegExp(`^${model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
  const plain = name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const word = plain.match(/^(\w+)\s+(generation|gen|generacion|serie|series)\b/);
  if (word && ORDINALS[word[1]!]) return ORDINALS[word[1]!]!;
  const nth = plain.match(/^(\d{1,2})(st|nd|rd|th|e|eme|ere)?\s*(generation|gen)\b/);
  if (nth && ROMAN[Number(nth[1])]) return ROMAN[Number(nth[1])]!;
  name = name.replace(/\s*\(.*\)\s*$/, "");
  return name;
}

/** Where a change came from: the model and the page. */
export type StewardSource = { name: string; url: string; retrievedAt: string };

const sourceOf = (s: StewardSource, url = s.url): CatalogFile["source"] => ({
  name: s.name,
  url,
  retrieved_at: s.retrievedAt,
  tier: SourceTier.RESEARCH,
});

const fileFor = (ctx: StewardContext, source: StewardSource, generations: CatalogGeneration[]): CatalogFile => ({
  format: "vehicle-catalog@1",
  source: sourceOf(source),
  makes: [{ name: ctx.make.name, models: [{ name: ctx.model.name, category: ctx.model.category as any, generations }] }],
});

/** A researched version as a catalog configuration (units converted); null when its power is unusable. */
function toVehicle(v: z.infer<typeof versionFound>): CatalogVehicle | null {
  const power_kw = powerToKw(v.power, v.power_unit);
  if (!power_kw) return null;
  const electric = v.fuel === FuelType.ELECTRIC;
  return {
    engine: {
      code: v.engine_code?.trim().toUpperCase() || null,
      fuel: v.fuel,
      layout: electric ? EngineLayout.ELECTRIC_MOTOR : v.layout,
      cylinders: electric ? null : v.cylinders,
      displacement_cc: electric ? null : displacementToCc(v.displacement, v.displacement_unit),
      power_kw,
    },
    body_style: v.body,
    doors: Math.min(6, Math.max(2, v.doors)),
    drive: v.drive,
    transmission: v.gearbox,
    trim: v.trim?.trim() || null,
    year_start: v.from,
    year_end: v.to,
    references: [],
  };
}

/** What checking an answer found: kept items and what was dropped for want of evidence. */
export type StewardChecked = { file: CatalogFile | null; unsupported: string[]; assumed: number; kept: number };

/** Research answers: the generations, or the generation's configurations, whose quotes check out. */
export function researchFile(
  ctx: StewardContext,
  output: StewardOutput<CatalogTaskKind.RESEARCH_GENERATIONS> | StewardOutput<CatalogTaskKind.RESEARCH_CONFIGURATIONS>,
  evidence: string,
  source: StewardSource,
): StewardChecked {
  const unsupported: string[] = [];
  if (ctx.kind === CatalogTaskKind.RESEARCH_GENERATIONS) {
    const out = output as StewardOutput<CatalogTaskKind.RESEARCH_GENERATIONS>;
    const generations: CatalogGeneration[] = [];
    for (const g of out.generations) {
      if (!quoteSupports(evidence, g.quote, [g.from])) {
        unsupported.push(`generation ${g.name} (${g.from})`);
        continue;
      }
      generations.push({ name: generationName(g.name, ctx.model.name), code: g.code?.trim() || null, year_start: g.from, year_end: g.to, vehicles: [], source: source.url });
    }
    return { file: generations.length ? fileFor(ctx, source, generations) : null, unsupported, assumed: 0, kept: generations.length };
  }
  const out = output as StewardOutput<CatalogTaskKind.RESEARCH_CONFIGURATIONS>;
  const gen = ctx.generation!;
  const vehicles: CatalogVehicle[] = [];
  let assumed = 0;
  for (const v of out.configurations) {
    const vehicle = quoteSupports(evidence, v.quote, [v.power]) ? toVehicle(v) : null;
    if (!vehicle) {
      unsupported.push(`version ${v.power} ${v.power_unit} ${v.from}`);
      continue;
    }
    if (v.assumed) assumed++;
    vehicles.push(vehicle);
  }
  // Generation corrections count only with their own evidence.
  const g = out.generation;
  const corrected = g.quote && quoteSupports(evidence, g.quote, [g.from, g.to]);
  const generation: CatalogGeneration = {
    name: gen.name,
    code: corrected ? g.code?.trim() || null : null,
    year_start: corrected && g.from ? g.from : gen.year_start,
    year_end: corrected && g.from ? g.to : gen.year_end,
    vehicles,
    source: source.url,
  };
  return { file: vehicles.length ? fileFor(ctx, source, [generation]) : null, unsupported, assumed, kept: vehicles.length };
}

/** A field of a record the source disagrees with. */
export type Correction = { entity: "VehicleGeneration" | "Vehicle" | "VehicleEngine"; id: string; ref: string; field: string; from: unknown; to: unknown; quote: string };

/** What a verification answer means for the catalog. */
export type VerificationOutcome = {
  /** Records the source confirms (stamp them). */
  confirmed: { entity: "VehicleModel" | "VehicleGeneration" | "Vehicle" | "VehicleEngine"; id: string }[];
  /** Corrections that may be applied now (the record is draft, or the field was blank). */
  apply: Correction[];
  /** Corrections a person should settle (the record's tier is not below research, or an engine). */
  review: Correction[];
  /** New records the source lists, as a file to import (merge, without stamping existing ones). */
  missing: CatalogFile | null;
  unsupported: string[];
};

const differs = (catalog: unknown, source: unknown) => source != null && source !== "" && catalog !== source;

/** Compares what the source says with the catalog, for a verification task. */
export function verificationOutcome(
  ctx: StewardContext,
  output: StewardOutput<CatalogTaskKind.VERIFY_MODEL> | StewardOutput<CatalogTaskKind.VERIFY_GENERATION>,
  evidence: string,
  source: StewardSource,
): VerificationOutcome {
  const r = refs(ctx);
  const outcome: VerificationOutcome = { confirmed: [], apply: [], review: [], missing: null, unsupported: [] };
  const correct = (c: Correction, recordTier: string, blank: boolean, neverAuto = false) =>
    (!neverAuto && ((blank && mayFill(recordTier, SourceTier.RESEARCH, c.field)) || mayOverwrite(recordTier, SourceTier.RESEARCH))
      ? outcome.apply
      : outcome.review
    ).push(c);

  if (ctx.kind === CatalogTaskKind.VERIFY_MODEL) {
    const out = output as StewardOutput<CatalogTaskKind.VERIFY_MODEL>;
    let anyConfirmed = false;
    for (const item of out.generations) {
      const g = r.generations.get(item.ref);
      if (!g || !item.found) continue;
      if (!quoteSupports(evidence, item.quote, [item.from ?? g.year_start])) {
        outcome.unsupported.push(`${item.ref} (${g.name})`);
        continue;
      }
      const changes: Correction[] = [];
      const field = (name: "code" | "year_start" | "year_end", catalog: unknown, said: unknown) => {
        if (differs(catalog, said)) changes.push({ entity: "VehicleGeneration", id: g.id, ref: item.ref, field: name, from: catalog, to: said, quote: item.quote! });
      };
      field("code", g.code, item.code?.trim() || null);
      field("year_start", g.year_start, item.from);
      // An end year only counts when the source gives one (null may just mean "not stated").
      field("year_end", g.year_end, item.to);
      if (!changes.length) {
        outcome.confirmed.push({ entity: "VehicleGeneration", id: g.id });
        anyConfirmed = true;
      }
      for (const c of changes) correct(c, g.source_tier, c.from == null || c.from === "");
    }
    if (anyConfirmed) outcome.confirmed.push({ entity: "VehicleModel", id: ctx.model.id });
    const missing: CatalogGeneration[] = [];
    for (const m of out.missing) {
      if (!quoteSupports(evidence, m.quote, [m.from])) {
        outcome.unsupported.push(`missing ${m.name}`);
        continue;
      }
      missing.push({ name: generationName(m.name, ctx.model.name), code: m.code?.trim() || null, year_start: m.from, year_end: m.to, vehicles: [], source: source.url });
    }
    outcome.missing = missing.length ? fileFor(ctx, source, missing) : null;
    return outcome;
  }

  const out = output as StewardOutput<CatalogTaskKind.VERIFY_GENERATION>;
  const gen = ctx.generation!;
  const engineOf = (v: StewardVehicle) => ctx.engines?.find((e) => e.id === v.engine_id);
  const powerForms = (kw: number) => [kw, Math.round(kw / 0.73549875), Math.round(kw / 0.7457)];
  for (const item of out.configurations) {
    const v = r.vehicles.get(item.ref);
    if (!v || !item.found) continue;
    const e = engineOf(v);
    if (!quoteSupports(evidence, item.quote, e ? powerForms(e.power_kw) : [])) {
      outcome.unsupported.push(`${item.ref}`);
      continue;
    }
    const changes: Correction[] = [];
    if (differs(v.year_start, item.from)) changes.push({ entity: "Vehicle", id: v.id, ref: item.ref, field: "year_start", from: v.year_start, to: item.from, quote: item.quote! });
    if (differs(v.year_end, item.to)) changes.push({ entity: "Vehicle", id: v.id, ref: item.ref, field: "year_end", from: v.year_end, to: item.to, quote: item.quote! });
    if (!changes.length) outcome.confirmed.push({ entity: "Vehicle", id: v.id });
    for (const c of changes) correct(c, v.source_tier, c.from == null);
  }
  for (const item of out.engines) {
    const e = r.engines.get(item.ref);
    if (!e || !item.found) continue;
    if (!quoteSupports(evidence, item.quote, [item.power])) {
      outcome.unsupported.push(`${item.ref}`);
      continue;
    }
    const kw = powerToKw(item.power, item.power_unit);
    const cc = displacementToCc(item.displacement, item.displacement_unit);
    const changes: Correction[] = [];
    // An engine is shared by configurations of other generations: never changed without a person.
    if (kw != null && Math.abs(kw - e.power_kw) > 1) changes.push({ entity: "VehicleEngine", id: e.id, ref: item.ref, field: "power_kw", from: e.power_kw, to: kw, quote: item.quote! });
    if (cc != null && e.displacement_cc != null && cc !== e.displacement_cc) changes.push({ entity: "VehicleEngine", id: e.id, ref: item.ref, field: "displacement_cc", from: e.displacement_cc, to: cc, quote: item.quote! });
    if (cc != null && e.displacement_cc == null) changes.push({ entity: "VehicleEngine", id: e.id, ref: item.ref, field: "displacement_cc", from: null, to: cc, quote: item.quote! });
    if (!changes.length && kw != null) outcome.confirmed.push({ entity: "VehicleEngine", id: e.id });
    for (const c of changes) correct(c, e.source_tier, false, true);
  }
  const missing: CatalogVehicle[] = [];
  for (const m of out.missing) {
    const vehicle = quoteSupports(evidence, m.quote, [m.power]) ? toVehicle(m) : null;
    if (!vehicle) {
      outcome.unsupported.push(`missing ${m.power} ${m.power_unit}`);
      continue;
    }
    missing.push(vehicle);
  }
  outcome.missing = missing.length
    ? fileFor(ctx, source, [{ name: gen.name, code: null, year_start: gen.year_start, year_end: gen.year_end, vehicles: missing, source: source.url }])
    : null;
  return outcome;
}
