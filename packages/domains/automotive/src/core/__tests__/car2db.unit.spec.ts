import { validateCatalog } from "@repo/module-vehicle/core";
import { car2dbToCatalog, generationName, psToKw, type Car2dbModelData, type Car2dbTrim } from "../catalog-sources/car2db";

const spec = (specificationName: string, value: string) => ({ specificationName, value });
const trim = (id: number, seriesId: number, name: string, specs: Record<string, string>, years: Partial<Car2dbTrim> = {}): Car2dbTrim => ({
  id,
  seriesId,
  name,
  ...years,
  specificationValues: Object.entries(specs).map(([k, v]) => spec(k, v)),
});
const tdi = { "Engine type": "Diesel", Capacity: "1968", "Engine power": "150", "Cylinder layout": "Inline", "Number of cylinders": "4", "Gearbox type": "robot", "Drive wheels": "Four wheel drive (4WD)", "Body type": "Crossover" };

const q3: Car2dbModelData = {
  model: { name: "Q3", category: "CAR" },
  car2dbModel: { id: 93, name: "Q3" },
  generations: [
    { id: 1, name: "1 generation (8U)", yearBegin: "2011", yearEnd: "2014" },
    { id: 2, name: "8U", yearBegin: "2011", yearEnd: "2014" }, // same generation, other naming scheme
    { id: 3, name: "F3", yearBegin: "2018", yearEnd: "2030" }, // future end: still produced
  ],
  series: [
    { id: 10, generationId: 1, name: "Crossover" },
    { id: 20, generationId: 2, name: "Crossover" },
    { id: 30, generationId: 3, name: "Crossover" },
  ],
  trims: [
    trim(100, 10, "2.0 TDI quattro (150 hp)", tdi),
    trim(101, 20, "2.0 TDI quattro (150 hp)", tdi), // duplicate configuration
    trim(102, 30, "35 TFSI MT (150 hp)", { ...tdi, "Engine type": "Gasoline", Capacity: "1498", "Engine power": "", "Gearbox type": "Manual", "Drive wheels": "Front wheel drive" }, { startProductionYear: "2019" }),
    trim(103, 30, "e-tron", { "Engine type": "Electro", "Engine power": "408", "Gearbox type": "Automatic", "Drive wheels": "full", "Body type": "Crossover" }),
    trim(104, 30, "Empty", {}),
  ],
};

describe("car2db → vehicle catalog", () => {
  const { file, issues } = car2dbToCatalog({ make: "Audi", models: [q3], retrievedAt: "2026-10-07", thisYear: 2026 });
  const gens = file.makes[0]!.models[0]!.generations;

  it("names generations and merges car2db's two naming schemes", () => {
    expect(generationName("1 generation (8U) [restyling]")).toEqual({ name: "I facelift", code: "8U", stage: 1 });
    expect(generationName("8P/8PA [2th restyling]")).toEqual({ name: "8P/8PA facelift 2", code: "8P/8PA", stage: 2 });
    expect(gens.map((g) => [g.name, g.code, g.year_start, g.year_end, g.vehicles.length])).toEqual([
      ["I", "8U", 2011, 2014, 1], // the duplicate trim of "8U" is merged away
      ["F3", "F3", 2018, null, 2],
    ]);
  });

  it("maps specifications to configurations (PS → kW, drive, gearbox, body, fuel)", () => {
    expect(psToKw(150)).toBe(110);
    expect(gens[0]!.vehicles[0]).toMatchObject({
      engine: { fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1968, power_kw: 110, code: null },
      body_style: "SUV",
      doors: 5,
      drive: "AWD",
      transmission: "DUAL_CLUTCH",
      trim: "2.0 TDI quattro",
      year_start: 2011,
      year_end: 2014,
      references: [{ source: "OTHER", external_id: "car2db:trim:100" }],
    });
    // Power from the trim name when the spec is empty; the trim's own first year.
    expect(gens[1]!.vehicles[0]).toMatchObject({ engine: { fuel: "GASOLINE", power_kw: 110 }, drive: "FWD", year_start: 2019, year_end: null });
    expect(gens[1]!.vehicles[1]).toMatchObject({ engine: { fuel: "ELECTRIC", layout: "ELECTRIC_MOTOR", displacement_cc: null, power_kw: 300 }, drive: "AWD" });
  });

  it("skips trims it can't map, one issue per trim, and produces a valid file", () => {
    expect(issues).toEqual([{ model: "Audi Q3", trim: "Empty", problem: expect.stringContaining("unknown engine type") }]);
    expect(validateCatalog(file)).toEqual([]);
  });
});
