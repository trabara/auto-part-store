import { CatalogFileSchema, type CatalogFile } from "../../contract";
import { planCatalog, validateCatalog, type CatalogSnapshot } from "../../core";

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
    expect(f.makes[0]!.models[0]!.category).toBe("CAR");
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

  it("is idempotent: matches existing records by natural key and reports differences", () => {
    const snapshot: CatalogSnapshot = {
      makes: [{ id: "mk", name: "RENAULT" }],
      models: [{ id: "md", make_id: "mk", name: "clio", category: "LCV" }],
      generations: [{ id: "g", model_id: "md", name: "V", code: "BF", year_start: 2019, year_end: null }],
      engines: [{ id: "e", ...engine }],
      vehicles: [
        { id: "v", generation_id: "g", engine_id: "e", body_style: "HATCHBACK", drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2019, year_end: null, doors: 3 },
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
    expect(plan.differences).toEqual([
      "Renault › Clio: category is LCV, catalog says CAR.",
      "Renault › Clio › V: code is BF, catalog says empty.",
      "Renault › Clio › V › #1: doors is 3, catalog says 5.",
    ]);
  });

  it("refuses a reference that belongs to another vehicle", () => {
    const snapshot = { ...empty, references: [{ source: "TECDOC_KTYPE", external_id: "1", vehicle_id: "other" }] };
    expect(planCatalog(file(), snapshot).problems).toEqual([
      "Renault › Clio › V › #1: reference TECDOC_KTYPE:1 belongs to another vehicle.",
    ]);
  });
});
