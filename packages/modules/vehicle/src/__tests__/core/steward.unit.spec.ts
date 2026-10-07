import { CatalogTaskKind, CatalogTaskStatus, SourceTier } from "../../contract";
import {
  buildPrompt,
  claimable,
  generationName,
  lintCatalog,
  nextRun,
  normalizeText,
  outputSchema,
  parseOutput,
  quoteSupports,
  researchFile,
  taskCandidates,
  verificationOutcome,
  type LintRecords,
  type StewardContext,
} from "../../core";

const now = new Date("2026-10-07T12:00:00Z");
const source = { name: "Local research (qwen3.5:4b)", url: "https://en.wikipedia.org/wiki/Renault_Clio", retrievedAt: "2026-10-07" };

describe("ledger", () => {
  const records = {
    makes: [{ id: "mk", name: "Renault" }],
    models: [
      { id: "clio", make_id: "mk", name: "Clio", category: "CAR", on_sale_new: true, source_tier: SourceTier.REFERENCE, verified_at: "2026-09-01" },
      { id: "r4", make_id: "mk", name: "4", category: "CAR", on_sale_new: false },
      { id: "zoe", make_id: "mk", name: "Zoe", category: "CAR", on_sale_new: false },
    ],
    generations: [
      { id: "g4", model_id: "clio", name: "IV", code: null, year_start: 2012, year_end: 2019, source_tier: SourceTier.REFERENCE, verified_at: "2026-09-01" },
      { id: "g5", model_id: "clio", name: "V", code: "BF", year_start: 2019, year_end: null, source_tier: SourceTier.REFERENCE, verified_at: "2026-09-01" },
      { id: "r4i", model_id: "r4", name: "I", code: null, year_start: 1961, year_end: 1994, source_tier: SourceTier.DRAFT, verified_at: null },
    ],
    vehicles: [{ id: "v", generation_id: "g4", engine_id: "e", source_tier: SourceTier.DRAFT, verified_at: null }],
    engines: [{ id: "e", source_tier: SourceTier.REFERENCE, verified_at: "2026-09-01" }],
  };

  it("queues research for gaps and verification for records due, most valuable first", () => {
    const tasks = taskCandidates(records, { now });
    expect(tasks.map((t) => [t.kind, t.key, t.priority])).toEqual([
      [CatalogTaskKind.RESEARCH_CONFIGURATIONS, "renault/clio/v", 80 + 50 + 30], // on sale, ongoing
      [CatalogTaskKind.RESEARCH_GENERATIONS, "renault/zoe", 100],
      [CatalogTaskKind.VERIFY_GENERATION, "renault/clio/iv", 60 + 50 + 20], // its configuration is draft: due now
      [CatalogTaskKind.RESEARCH_CONFIGURATIONS, "renault/4/i", 80],
      [CatalogTaskKind.VERIFY_MODEL, "renault/4", 60], // a draft generation, never verified
    ].sort((a, b) => (b[2] as number) - (a[2] as number)));
  });

  it("backs off by outcome and only lets due tasks be claimed", () => {
    expect(nextRun(CatalogTaskStatus.FAILED, 3, now)!.toISOString()).toBe("2026-10-15T12:00:00.000Z");
    expect(nextRun(CatalogTaskStatus.FAILED, 9, now)!.getTime() - now.getTime()).toBe(60 * 86_400_000);
    expect(nextRun(CatalogTaskStatus.NO_DATA, 1, now)!.toISOString()).toBe("2027-01-05T12:00:00.000Z");
    expect(nextRun(CatalogTaskStatus.REVIEW, 1, now)).toBeNull();
    expect(claimable({ status: "PENDING" }, now)).toBe(true);
    expect(claimable({ status: "FAILED", next_run_at: "2026-10-08" }, now)).toBe(false);
    expect(claimable({ status: "RUNNING", lease_until: "2026-10-07T11:00:00Z" }, now)).toBe(true);
    expect(claimable({ status: "REVIEW" }, now)).toBe(false);
  });
});

describe("lint", () => {
  const base: LintRecords = {
    makes: [
      { id: "m1", name: "Mercedes-Benz" },
      { id: "m2", name: "Mercedes" },
      { id: "m3", name: "Renault " },
    ],
    models: [
      { id: "md1", make_id: "m3", name: "Renault Clio", category: "CAR" },
      { id: "md2", make_id: "m3", name: "Master Fourgon", category: "CAR" },
      { id: "md3", make_id: "m3", name: "Kangoo", category: "LCV" },
      { id: "md4", make_id: "m3", name: "kangoo", category: "LCV" },
    ],
    generations: [
      { id: "g1", model_id: "md1", name: "IV", code: "BH", year_start: 2012, year_end: 2019 },
      { id: "g2", model_id: "md1", name: "Mk5", code: "BH", year_start: 2015, year_end: null },
    ],
    engines: [
      { id: "e1", code: "K9K", fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 66 },
      { id: "e2", code: null, fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 66 },
      { id: "e3", code: null, fuel: "ELECTRIC", layout: "ELECTRIC_MOTOR", cylinders: 4, displacement_cc: null, power_kw: 80 },
      { id: "e4", code: null, fuel: "GASOLINE", layout: "INLINE", cylinders: 3, displacement_cc: 999, power_kw: 300 },
    ],
    vehicles: [
      { id: "v1", generation_id: "g1", engine_id: "e1", body_style: "HATCHBACK", doors: 5, drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2012, year_end: 2016 },
      { id: "v2", generation_id: "g1", engine_id: "e2", body_style: "HATCHBACK", doors: 5, drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2014, year_end: 2019 },
      { id: "v3", generation_id: "g2", engine_id: "e3", body_style: "HATCHBACK", doors: 5, drive: "FOUR_WD", transmission: "MANUAL", trim: null, year_start: 2016, year_end: null },
      { id: "v4", generation_id: "g2", engine_id: "e4", body_style: "HATCHBACK", doors: 5, drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2014, year_end: null },
    ],
    references: [{ id: "r1", vehicle_id: "v1", source: "TECDOC_KTYPE", external_id: "K-123" }],
  };
  const findings = lintCatalog(base, { now });
  const rules = (id: string) => findings.filter((f) => f.id === id).map((f) => f.rule).sort();

  it("checks every entity against its rules", () => {
    expect(rules("m2")).toEqual(["make.duplicate", "make.no_models"]);
    expect(rules("m3")).toEqual(["make.whitespace"]);
    expect(rules("md1")).toEqual(["generation.naming", "model.name_contains_make"]);
    expect(rules("md2")).toEqual(["model.category"]);
    expect(rules("md4")).toEqual(["model.duplicate"]);
    expect(rules("g2")).toEqual(["generation.duplicate_code", "generation.ongoing_long", "generation.overlap"]);
    expect(rules("e2")).toEqual(["engine.duplicate"]);
    expect(rules("e3")).toEqual(["engine.electric_fields"]);
    expect(rules("e4")).toEqual(["engine.specific_output"]);
    expect(rules("v2")).toEqual(["vehicle.near_duplicate"]);
    expect(rules("v3")).toEqual(["vehicle.drive_category", "vehicle.electric_manual"]);
    expect(rules("v4")).toEqual(["vehicle.outside_generation"]);
    expect(rules("r1")).toEqual(["reference.format"]);
  });

  it("proposes fixes, and only whitespace is safe to apply alone", () => {
    const fix = (rule: string) => findings.find((f) => f.rule === rule)!.fix;
    expect(fix("make.whitespace")).toEqual({ kind: "update", data: { name: "Renault" }, safe: true });
    expect(fix("model.name_contains_make")).toEqual({ kind: "update", data: { name: "Clio" } });
    expect(fix("engine.duplicate")).toEqual({ kind: "merge", into: "e1" });
    expect(findings.filter((f) => f.fix && "safe" in f.fix && f.fix.safe).map((f) => f.rule)).toEqual(["make.whitespace"]);
    // Keys are stable across runs: rule and record (and the other record of a pair).
    expect(findings.find((f) => f.rule === "make.duplicate")!.key).toBe("make.duplicate:m2:m1");
  });
});

describe("steward", () => {
  const evidence = [
    "Renault Clio V (BF) is the fifth generation, produced from 2019.",
    "| Engine | Power | Years |",
    "| 1.5 dCi 85 | 85 ch (63 kW) | 2019–2023 |",
    "| 1.0 TCe 90 | 90 ch | 2019– |",
  ].join("\n");
  const ctx = (kind: CatalogTaskKind, extra: Partial<StewardContext> = {}): StewardContext => ({
    kind,
    make: { id: "mk", name: "Renault" },
    model: { id: "clio", name: "Clio", category: "CAR", source_tier: SourceTier.REFERENCE },
    generations: [{ id: "g5", name: "V", code: null, year_start: 2019, year_end: null, source_tier: SourceTier.DRAFT }],
    generation: { id: "g5", name: "V", code: null, year_start: 2019, year_end: null, source_tier: SourceTier.DRAFT },
    ...extra,
  });

  it("checks quotes against the evidence, whatever the markup, accents and dashes", () => {
    expect(normalizeText("Génération  –  CLIO")).toBe("generation - clio");
    expect(quoteSupports(evidence, "1.5 dCi 85 85 ch (63 kW) 2019-2023", [85])).toBe(true);
    expect(quoteSupports(evidence, "1.5 dCi 85 … 2019–2023", [85])).toBe(true);
    expect(quoteSupports(evidence, "1.5 dCi 110 ch", [110])).toBe(false); // not in the evidence
    expect(quoteSupports(evidence, "1.0 TCe 90 90 ch", [95])).toBe(false); // the number isn't quoted
  });

  it("names generations the catalog's way", () => {
    expect(generationName("Fifth generation (BF)", "Clio")).toBe("V");
    expect(generationName("troisième génération", "Clio")).toBe("III");
    expect(generationName("2nd generation", "Clio")).toBe("II");
    expect(generationName("Clio IV", "Clio")).toBe("IV");
    expect(generationName("Mk7", "Golf")).toBe("Mk7");
  });

  it("builds a compact prompt with a JSON schema, refs instead of ids", () => {
    const prompt = buildPrompt(
      ctx(CatalogTaskKind.VERIFY_GENERATION, {
        vehicles: [{ id: "v-id", engine_id: "e-id", body_style: "HATCHBACK", doors: 5, drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2019, year_end: null, source_tier: SourceTier.DRAFT }],
        engines: [{ id: "e-id", code: "K9K", fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 63, source_tier: SourceTier.DRAFT }],
      }),
      [{ url: source.url, text: evidence }],
    );
    const user = prompt.messages[1]!.content;
    expect(user).toContain("c1: DIESEL INLINE 4 cyl 1461 cm3 63 kW code K9K, hatchback 5 doors, FWD, manual, 2019–present");
    expect(user).toContain("e1: DIESEL INLINE 4 cyl 1461 cm3 63 kW code K9K");
    expect(user).not.toContain("v-id");
    expect(user).toContain(`EVIDENCE (source: ${source.url})`);
    expect(prompt.schema).toMatchObject({ type: "object", required: expect.arrayContaining(["configurations", "engines", "missing"]) });
    expect(() => outputSchema(CatalogTaskKind.CLEANUP)).toThrow();
  });

  it("turns researched versions into configurations: units converted, unsupported ones dropped", () => {
    const version = { engine_code: null, fuel: "DIESEL", layout: null, cylinders: null, displacement: 1.5, displacement_unit: "L", body: "HATCHBACK", doors: 5, drive: "FWD", gearbox: "MANUAL", trim: null, assumed: true };
    const output = parseOutput(CatalogTaskKind.RESEARCH_CONFIGURATIONS, JSON.stringify({
      generation: { code: "BF", from: 2019, to: null, quote: "Renault Clio V (BF) is the fifth generation, produced from 2019" },
      configurations: [
        { ...version, power: 85, power_unit: "ch", from: 2019, to: 2023, quote: "1.5 dCi 85 | 85 ch (63 kW) | 2019–2023" },
        { ...version, fuel: "GASOLINE", power: 110, power_unit: "ch", from: 2019, to: null, quote: "1.3 TCe 110 ch" }, // invented
      ],
      notes: "",
    }))!;
    const checked = researchFile(ctx(CatalogTaskKind.RESEARCH_CONFIGURATIONS), output, evidence, source);
    expect(checked.unsupported).toEqual(["version 110 ch 2019"]);
    expect(checked.kept).toBe(1);
    expect(checked.assumed).toBe(1);
    const gen = checked.file!.makes[0]!.models[0]!.generations[0]!;
    expect(gen).toMatchObject({ name: "V", code: "BF", year_start: 2019, source: source.url });
    expect(gen.vehicles[0]).toMatchObject({ engine: { power_kw: 63, displacement_cc: null, fuel: "DIESEL" }, year_start: 2019, year_end: 2023 });
    expect(checked.file!.source).toMatchObject({ name: source.name, tier: SourceTier.RESEARCH });
  });

  it("rejects answers that don't follow the schema", () => {
    expect(parseOutput(CatalogTaskKind.RESEARCH_GENERATIONS, "{ not json")).toBeNull();
    expect(parseOutput(CatalogTaskKind.RESEARCH_GENERATIONS, { generations: [{ name: "V" }], notes: "" })).toBeNull();
  });

  it("compares a verification with the catalog: confirms, corrects drafts, leaves the rest to people", () => {
    const vehicle = { id: "v1", engine_id: "e1", body_style: "HATCHBACK", doors: 5, drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2019, year_end: null, source_tier: SourceTier.DRAFT };
    const c = ctx(CatalogTaskKind.VERIFY_GENERATION, {
      vehicles: [vehicle, { ...vehicle, id: "v2", body_style: "WAGON", source_tier: SourceTier.LICENSED }],
      engines: [
        { id: "e1", code: null, fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 63, source_tier: SourceTier.DRAFT },
        { id: "e2", code: null, fuel: "GASOLINE", layout: "INLINE", cylinders: 3, displacement_cc: 999, power_kw: 74, source_tier: SourceTier.DRAFT },
      ],
    });
    const outcome = verificationOutcome(
      c,
      parseOutput(CatalogTaskKind.VERIFY_GENERATION, {
        configurations: [
          { ref: "c1", found: true, from: 2019, to: 2023, quote: "1.5 dCi 85 | 85 ch (63 kW) | 2019–2023" },
          { ref: "c2", found: true, from: 2019, to: 2023, quote: "1.5 dCi 85 | 85 ch (63 kW) | 2019–2023" }, // licensed: a person decides
        ],
        engines: [
          { ref: "e1", found: true, power: 85, power_unit: "ch", displacement: null, displacement_unit: null, quote: "85 ch (63 kW)" },
          { ref: "e2", found: true, power: 90, power_unit: "ch", displacement: null, displacement_unit: null, quote: "1.0 TCe 90 | 90 ch" },
        ],
        missing: [],
        notes: "",
      })!,
      evidence,
      source,
    );
    expect(outcome.confirmed).toEqual([{ entity: "VehicleEngine", id: "e1" }]);
    // c1's end year was blank: filled. c2 is licensed: a person decides. e2 says 66 kW, not 74: engines always go to review.
    expect(outcome.apply.map((x) => [x.id, x.field, x.to])).toEqual([["v1", "year_end", 2023]]);
    expect(outcome.review.map((x) => [x.id, x.field, x.to])).toEqual([
      ["v2", "year_end", 2023],
      ["e2", "power_kw", 66],
    ]);
  });
});
