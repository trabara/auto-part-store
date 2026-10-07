import { CatalogFileSchema, type CatalogFile } from "../../contract";
import { catalogCoverage, planCatalog, recordsToCatalog, researchTasks, validateCatalog, type CatalogSnapshot } from "../../core";

const engine = { fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 66, code: "K9K" };
const file = (patch: Partial<CatalogFile> = {}): CatalogFile =>
  CatalogFileSchema.parse({
    format: "vehicle-catalog@1",
    market: "tn",
    source: { name: "Test" },
    makes: [
      {
        name: "Renault",
        models: [
          {
            name: "Clio",
            generations: [
              {
                name: "V",
                year_start: 2019,
                vehicles: [
                  { engine, body_style: "HATCHBACK", doors: 5, year_start: 2019, references: [{ source: "TECDOC_KTYPE", external_id: "1" }] },
                  { engine: { ...engine, power_kw: 85 }, body_style: "HATCHBACK", doors: 5, year_start: 2020 },
                ],
              },
            ],
          },
          { name: "Express", category: "LCV", generations: [{ name: "II", year_start: 2021, vehicles: [{ engine, body_style: "VAN", year_start: 2021 }] }] },
        ],
      },
    ],
    ...patch,
  });
const empty: CatalogSnapshot = { makes: [], models: [], generations: [], engines: [], vehicles: [], references: [] };

describe("catalog file", () => {
  it("parses with defaults and normalizes the market", () => {
    const f = file();
    expect(f.market).toBe("TN");
    expect(f.makes[0]!.models[0]!.category).toBeUndefined(); // omitted: kept, or CAR when created
    expect(f.makes[0]!.models[0]!.generations[0]!.vehicles[1]).toMatchObject({ drive: "FWD", transmission: "MANUAL", trim: null, references: [] });
  });
});

describe("validateCatalog", () => {
  it("accepts a consistent file", () => {
    expect(validateCatalog(file())).toEqual([]);
  });

  it("explains duplicates, years outside the generation, overlaps and shared references", () => {
    const bad = file();
    const gen = bad.makes[0]!.models[0]!.generations[0]!;
    gen.year_end = 2024;
    gen.vehicles.push({ ...gen.vehicles[0]!, year_start: 2018, year_end: 2021 }); // before gen, overlaps #1, same ref
    bad.makes[0]!.models.push({ ...bad.makes[0]!.models[1]!, name: "express" });
    expect(validateCatalog(bad)).toEqual([
      "Renault › Clio › V › #1: ends after its generation (2024).",
      "Renault › Clio › V › #2: ends after its generation (2024).",
      "Renault › Clio › V › #3: starts (2018) before its generation (2019).",
      "Renault › Clio › V › #3: same configuration as #1 with overlapping years.",
      "Renault › Clio › V › #3: reference TECDOC_KTYPE:1 already used by Renault › Clio › V › #1.",
      "Renault › express: model appears twice.",
      "Renault › express › II: generation appears twice.",
    ]);
  });
});

describe("planCatalog", () => {
  it("creates everything missing, in order, sharing identical engines", () => {
    const plan = planCatalog(file(), empty);
    expect(plan.makes.map((m) => m.data.name)).toEqual(["Renault"]);
    expect(plan.models.map((m) => [m.data.name, m.data.category, m.make])).toEqual([
      ["Clio", "CAR", { key: "renault" }],
      ["Express", "LCV", { key: "renault" }],
    ]);
    expect(plan.generations).toHaveLength(2);
    // The 66 kW K9K is used twice but created once.
    expect(plan.engines.map((e) => e.data.power_kw)).toEqual([66, 85]);
    expect(plan.vehicles).toHaveLength(3);
    expect(plan.references).toEqual([{ vehicle: { key: plan.vehicles[0]!.key }, data: { source: "TECDOC_KTYPE", external_id: "1" } }]);
    expect(plan.problems).toEqual([]);
  });

  it("is idempotent: matches existing records by natural key, keeps values the file omits", () => {
    const snapshot: CatalogSnapshot = {
      makes: [{ id: "mk", name: "RENAULT" }],
      models: [{ id: "md", make_id: "mk", name: "clio", category: "LCV" }],
      generations: [{ id: "g", model_id: "md", name: "V", code: "BF", year_start: 2019, year_end: null }],
      engines: [{ id: "e", ...engine }],
      vehicles: [
        { id: "v", generation_id: "g", engine_id: "e", body_style: "HATCHBACK", drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2019, year_end: null, doors: 5 },
      ],
      references: [{ source: "TECDOC_KTYPE", external_id: "1", vehicle_id: "v" }],
    };
    const plan = planCatalog(file(), snapshot);
    expect(plan.makes).toEqual([]);
    expect(plan.models.map((m) => [m.data.name, m.make])).toEqual([["Express", { id: "mk" }]]);
    expect(plan.generations.map((g) => g.data.name)).toEqual(["II"]);
    expect(plan.engines.map((e) => e.data.power_kw)).toEqual([85]);
    expect(plan.vehicles.map((v) => [v.generation, v.engine])).toEqual([
      [{ id: "g" }, { key: plan.engines[0]!.key }],
      [{ key: "renault/express/ii" }, { id: "e" }],
    ]);
    expect(plan.references).toEqual([]);
    expect(plan.existing).toEqual({ makes: 1, models: 1, generations: 1, engines: 1, vehicles: 1, references: 1 });
    // The file omits Clio's category and V's code: the catalog's (LCV, BF) stay, nothing to report.
    expect(plan.differences).toEqual([]);
    expect(plan.updates).toEqual([]);
  });

  it("treats a version with other doors as another configuration", () => {
    const snapshot: CatalogSnapshot = {
      ...empty,
      makes: [{ id: "mk", name: "Renault" }],
      models: [{ id: "md", make_id: "mk", name: "Clio", category: "CAR" }],
      generations: [{ id: "g", model_id: "md", name: "V", code: null, year_start: 2019, year_end: null }],
      engines: [{ id: "e", ...engine }],
      vehicles: [
        { id: "v3", generation_id: "g", engine_id: "e", body_style: "HATCHBACK", drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2019, year_end: null, doors: 3 },
      ],
    };
    const plan = planCatalog(file(), snapshot);
    expect(plan.existing.vehicles).toBe(0);
    expect(plan.vehicles.map((v) => [v.generation, v.data.doors])).toContainEqual([{ id: "g" }, 5]);
    expect(plan.problems).toEqual([]);
  });

  describe("modes", () => {
    // Catalog: Clio V from 2018 without code, ongoing; configuration #1 ongoing.
    const snapshot = (): CatalogSnapshot => ({
      makes: [{ id: "mk", name: "Renault" }],
      models: [{ id: "md", make_id: "mk", name: "Clio", category: "CAR" }],
      generations: [{ id: "g", model_id: "md", name: "V", code: null, year_start: 2018, year_end: null }],
      engines: [{ id: "e", ...engine }],
      vehicles: [
        { id: "v", generation_id: "g", engine_id: "e", body_style: "HATCHBACK", drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2019, year_end: null, doors: 5 },
      ],
      references: [{ source: "TECDOC_KTYPE", external_id: "1", vehicle_id: "v" }],
    });
    // Research: V is "BF", 2019–2025; #1 ended in 2024.
    const research = () => {
      const f = file();
      const gen = f.makes[0]!.models[0]!.generations[0]!;
      Object.assign(gen, { code: "BF", year_end: 2025 });
      gen.vehicles[0]!.year_end = 2024;
      gen.vehicles[1]!.year_end = 2025;
      return f;
    };

    it("create: reports every contradicting value, updates nothing", () => {
      const plan = planCatalog(research(), snapshot());
      expect(plan.updates).toEqual([]);
      expect(plan.differences).toEqual([
        "Renault › Clio › V: code is empty, catalog says BF.",
        "Renault › Clio › V: year_start is 2018, catalog says 2019.",
        "Renault › Clio › V: year_end is empty, catalog says 2025.",
        "Renault › Clio › V › #1: year_end is empty, catalog says 2024.",
      ]);
    });

    it("fill: writes values the record lacks, reports the others", () => {
      const plan = planCatalog(research(), snapshot(), { mode: "fill" });
      expect(plan.updates.map((u) => [u.entity, u.id, u.data])).toEqual([
        ["VehicleGeneration", "g", { code: "BF", year_end: 2025 }],
        ["Vehicle", "v", { year_end: 2024 }],
      ]);
      expect(plan.updates.flatMap((u) => u.changes)).toEqual([
        "Renault › Clio › V: code empty → BF.",
        "Renault › Clio › V: year_end empty → 2025.",
        "Renault › Clio › V › #1: year_end empty → 2024.",
      ]);
      expect(plan.differences).toEqual(["Renault › Clio › V: year_start is 2018, catalog says 2019."]);
      expect(plan.problems).toEqual([]);
    });

    it("overwrite: writes every contradicting value, never a blank one", () => {
      const plan = planCatalog(research(), snapshot(), { mode: "overwrite" });
      expect(plan.updates.find((u) => u.id === "g")!.data).toEqual({ code: "BF", year_start: 2019, year_end: 2025 });
      expect(plan.differences).toEqual([]);
      const omitted = research();
      omitted.makes[0]!.models[0]!.generations[0]!.code = null;
      const s = snapshot();
      s.generations[0]!.code = "BF";
      expect(planCatalog(omitted, s, { mode: "overwrite" }).updates.find((u) => u.id === "g")!.data).not.toHaveProperty("code");
    });

    it("refuses new generation years that leave a configuration outside", () => {
      const f = research();
      f.makes[0]!.models[0]!.generations[0]!.vehicles = [];
      const s = snapshot();
      s.vehicles[0]!.year_end = 2026;
      expect(planCatalog(f, s, { mode: "fill" }).problems).toEqual([
        "Renault › Clio › V: new years 2018–2025 leave a configuration (2019–2026) outside.",
      ]);
    });

    it("refuses a configuration end that falls outside its generation", () => {
      const f = research();
      f.makes[0]!.models[0]!.generations[0]!.year_end = null; // says nothing about V's end
      f.makes[0]!.models[0]!.generations[0]!.vehicles[1]!.year_end = null;
      const s = snapshot();
      s.generations[0]!.year_end = 2023;
      expect(planCatalog(f, s, { mode: "fill" }).problems).toContain(
        "Renault › Clio › V › #1: years 2019–2024 would fall outside the generation (2018–2023).",
      );
    });
  });

  describe("against the catalog", () => {
    // Catalog: Clio V (2020–), one 66 kW K9K hatchback from 2020; nothing else.
    const catalog = (): CatalogSnapshot => ({
      makes: [{ id: "mk", name: "Renault" }],
      models: [{ id: "md", make_id: "mk", name: "Clio", category: "CAR" }],
      generations: [{ id: "g", model_id: "md", name: "V", code: null, year_start: 2020, year_end: null }],
      engines: [{ id: "e", ...engine }, { id: "e85", ...engine, power_kw: 85, code: "H5H" }],
      vehicles: [
        { id: "v", generation_id: "g", engine_id: "e", body_style: "HATCHBACK", drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2020, year_end: null, doors: 5 },
        { id: "v85", generation_id: "g", engine_id: "e85", body_style: "HATCHBACK", drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2020, year_end: null, doors: 5 },
      ],
      references: [],
    });
    const clio = (vehicles: any[], gen: object = {}) =>
      file({
        makes: [{ name: "Renault", models: [{ name: "Clio", category: "CAR", generations: [{ name: "V", year_start: 2019, year_end: null, ...gen, vehicles }] }] }],
      } as any);
    const hatch = { body_style: "HATCHBACK", doors: 5, drive: "FWD", transmission: "MANUAL", trim: null, year_end: null, references: [] };

    it("refuses new configurations outside the generation's catalog years", () => {
      // The file says V starts in 2019; the catalog (2020) is kept, so 2019 does not fit.
      const plan = planCatalog(clio([{ ...hatch, engine: { ...engine, power_kw: 74 }, year_start: 2019 }]), catalog());
      expect(plan.problems).toEqual(["Renault › Clio › V › #1: years 2019– fall outside the catalog's generation (2020–)."]);
      // Overwriting the generation's years makes it fit.
      expect(planCatalog(clio([{ ...hatch, engine: { ...engine, power_kw: 74 }, year_start: 2019 }]), catalog(), { mode: "overwrite" }).problems).toEqual([]);
    });

    it("refuses what the database would: an identical configuration with overlapping years", () => {
      const plan = planCatalog(clio([{ ...hatch, engine, year_start: 2021 }], { year_start: 2020 }), catalog());
      expect(plan.problems).toEqual([
        "Renault › Clio › V › #1: overlaps an existing identical configuration (2020–); use its first year to match it.",
      ]);
    });

    it("warns about a configuration that looks like an existing one described differently", () => {
      // 85 kW petrol hatchback like the H5H, but without its engine code.
      const plan = planCatalog(clio([{ ...hatch, engine: { ...engine, power_kw: 85, code: null }, year_start: 2020 }], { year_start: 2020 }), catalog());
      expect(plan.problems).toEqual([]);
      expect(plan.warnings).toEqual([
        "Renault › Clio › V › #1: may duplicate an existing configuration (DIESEL 85 kW, H5H, 1461 cm³, 2020–); copy its values to match it.",
      ]);
    });

    it("warns about a new generation overlapping an existing one", () => {
      const f = file({
        makes: [{ name: "Renault", models: [{ name: "Clio", category: "CAR", generations: [{ name: "Mk5", year_start: 2019, vehicles: [] }] }] }],
      } as any);
      expect(planCatalog(f, catalog()).warnings).toEqual([
        'Renault › Clio › Mk5: new generation (2019–) overlaps existing "V" (2020–): the same generation under another name?',
      ]);
    });
  });

  it("refuses a reference that belongs to another vehicle", () => {
    const snapshot = { ...empty, references: [{ source: "TECDOC_KTYPE", external_id: "1", vehicle_id: "other" }] };
    expect(planCatalog(file(), snapshot).problems).toEqual([
      "Renault › Clio › V › #1: reference TECDOC_KTYPE:1 belongs to another vehicle.",
    ]);
  });
});

describe("export and coverage", () => {
  const records = {
    makes: [{ id: "mk", name: "Renault" }],
    models: [
      { id: "md", make_id: "mk", name: "Clio", category: "CAR" },
      { id: "mx", make_id: "mk", name: "Express", category: "LCV" },
      { id: "mz", make_id: "mk", name: "Zoe", category: "CAR" },
    ],
    generations: [
      { id: "g", model_id: "md", name: "V", code: "BF", year_start: 2019, year_end: null },
      { id: "g4", model_id: "md", name: "IV", code: null, year_start: 2012, year_end: 2019 },
      { id: "gx", model_id: "mx", name: "II", code: null, year_start: 2021, year_end: null },
    ],
    vehicles: [
      { id: "v", generation_id: "g", engine: { ...engine, name: null }, body_style: "HATCHBACK", doors: 5, drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2019, year_end: null },
    ],
    references: [{ vehicle_id: "v", source: "TECDOC_KTYPE", external_id: "1" }],
  };

  it("writes existing records back as a valid catalog that imports as unchanged", () => {
    const exported = recordsToCatalog(records, { name: "Export" });
    expect(CatalogFileSchema.parse(exported)).toEqual(exported);
    expect(exported.makes[0]!.models[0]!.generations.map((g) => g.name)).toEqual(["IV", "V"]);
    const snapshot: CatalogSnapshot = {
      makes: records.makes,
      models: records.models,
      generations: records.generations,
      engines: [{ id: "e", ...engine }],
      vehicles: [{ ...records.vehicles[0]!, engine_id: "e" }],
      references: records.references,
    };
    const plan = planCatalog(exported, snapshot);
    expect([plan.models, plan.generations, plan.vehicles, plan.engines, plan.references, plan.differences]).toEqual([[], [], [], [], [], []]);
  });

  it("lists models least complete first", () => {
    expect(catalogCoverage(records).map((c) => [c.model, c.generations, c.empty_generations, c.configurations])).toEqual([
      ["Zoe", 0, 0, 0],
      ["Express", 1, 1, 0],
      ["Clio", 2, 1, 1],
    ]);
  });
});

describe("researchTasks", () => {
  const records = {
    makes: [{ id: "mk", name: "Renault" }],
    models: [
      { id: "md", make_id: "mk", name: "Clio", category: "CAR" },
      { id: "mz", make_id: "mk", name: "Zoe", category: "CAR" },
    ],
    generations: [
      { id: "g3", model_id: "md", name: "III", code: null, year_start: 2005, year_end: 2012 },
      { id: "g4", model_id: "md", name: "IV", code: null, year_start: 2012, year_end: 2019 },
      { id: "g5", model_id: "md", name: "V", code: "BF", year_start: 2019, year_end: null },
    ],
    vehicles: [{ generation_id: "g4" }],
  };

  it("lists models without generations, then empty generations, most recent first", () => {
    const tasks = researchTasks(records);
    expect(tasks.map((t) => (t.kind === "generations" ? `${t.model}: generations` : `${t.model} ${t.generation.name}`))).toEqual([
      "Zoe: generations",
      "Clio V",
      "Clio III",
    ]);
    const v = tasks[1]!;
    expect(v.kind === "configurations" && v.generations.map((g) => [g.name, g.configurations])).toEqual([
      ["III", 0],
      ["IV", 1],
      ["V", 0],
    ]);
  });

  it("includes thin generations up to maxConfigurations", () => {
    expect(researchTasks(records, { maxConfigurations: 1 }).filter((t) => t.kind === "configurations")).toHaveLength(3);
  });
});
