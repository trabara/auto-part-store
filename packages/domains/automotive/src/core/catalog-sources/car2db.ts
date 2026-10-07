// car2db (https://car2db.com) → `vehicle-catalog@1`: generations, engines and
// configurations of our models from car2db's makes › models › generations ›
// series › trims (trim lists carry their specifications). Pure: the fetching
// script (../../scripts/fetch-car2db-catalog.ts) passes the API responses in.
import { psToKw } from "@repo/module-vehicle/core";
import {
  BodyStyle,
  Drive,
  EngineLayout,
  FuelType,
  Transmission,
  VehicleCategory,
  SourceTier,
  VehicleReferenceSource,
  type CatalogFile,
  type CatalogGeneration,
  type CatalogVehicle,
} from "@repo/module-vehicle/contract";

export type Car2dbGeneration = { id: number; name: string; yearBegin?: string | number | null; yearEnd?: string | number | null };
export type Car2dbSeries = { id: number; generationId: number; name: string };
export type Car2dbSpec = { specificationName: string; value: string; unit?: string | null };
export type Car2dbTrim = {
  id: number;
  seriesId: number;
  name: string;
  startProductionYear?: string | number | null;
  endProductionYear?: string | number | null;
  specificationValues?: Car2dbSpec[];
};
export type Car2dbModelData = {
  /** Our model (from the market catalog) the car2db model maps to. */
  model: { name: string; category: string };
  car2dbModel: { id: number; name: string };
  generations: Car2dbGeneration[];
  series: Car2dbSeries[];
  trims: Car2dbTrim[];
};

/** Values car2db uses that the mapping didn't recognize (reported, never guessed silently). */
export type MappingIssue = { model: string; trim: string; problem: string };

const year = (v: unknown, thisYear: number): number | null => {
  const n = typeof v === "number" ? v : Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n >= 1886 && n <= thisYear + 2 ? n : null;
};

/** Metric horsepower (PS) → kW. */
/** Metric horsepower (car2db lists PS) to kW: from the vehicle module, re-exported for the adapter tests. */
export { psToKw };

const FUEL: Record<string, CatalogVehicle["engine"]["fuel"]> = {
  gasoline: FuelType.GASOLINE,
  petrol: FuelType.GASOLINE,
  diesel: FuelType.DIESEL,
  electro: FuelType.ELECTRIC,
  electric: FuelType.ELECTRIC,
  hybrid: FuelType.HYBRID,
  "plug-in hybrid": FuelType.PLUG_IN_HYBRID,
  gas: FuelType.LPG,
  "gas/gasoline": FuelType.LPG,
  "gas balloon equipment": FuelType.LPG,
  lpg: FuelType.LPG,
  cng: FuelType.CNG,
  hydrogen: FuelType.HYDROGEN,
};
const LAYOUT: Record<string, NonNullable<CatalogVehicle["engine"]["layout"]>> = {
  inline: EngineLayout.INLINE,
  "v-type": EngineLayout.V,
  v: EngineLayout.V,
  opposed: EngineLayout.BOXER,
  boxer: EngineLayout.BOXER,
  "w-type": EngineLayout.W,
  w: EngineLayout.W,
  rotary: EngineLayout.ROTARY,
};
const TRANSMISSION: Record<string, CatalogVehicle["transmission"]> = {
  manual: Transmission.MANUAL,
  automatic: Transmission.AUTOMATIC,
  robot: Transmission.DUAL_CLUTCH,
  variator: Transmission.CVT,
  cvt: Transmission.CVT,
};

function body(raw: string): { body_style: CatalogVehicle["body_style"]; doors: number } | null {
  const v = raw.toLowerCase();
  const doors = Number(v.match(/(\d)\s*doors?/)?.[1]);
  const pick = (style: CatalogVehicle["body_style"], fallback: number) => ({ body_style: style, doors: doors || fallback });
  if (/pickup|pick-up/.test(v)) return pick(BodyStyle.PICKUP, 4);
  if (/chassis/.test(v)) return pick(BodyStyle.CHASSIS_CAB, 2);
  if (/minivan|compact van|mpv/.test(v)) return pick(BodyStyle.MINIVAN, 5);
  if (/\bvan\b|furgon|panel/.test(v)) return pick(BodyStyle.VAN, 4);
  if (/crossover|suv|offroad|off-road|jeep/.test(v)) return pick(BodyStyle.SUV, 5);
  if (/wagon|estate|touring|avant|universal/.test(v)) return pick(BodyStyle.WAGON, 5);
  if (/cabrio|convertible|roadster|spider|spyder/.test(v)) return pick(BodyStyle.CONVERTIBLE, 2);
  if (/coupe/.test(v)) return pick(BodyStyle.COUPE, 2);
  if (/hatchback|liftback|fastback|sportback/.test(v)) return pick(BodyStyle.HATCHBACK, 5);
  if (/sedan|saloon/.test(v)) return pick(BodyStyle.SEDAN, 4);
  return null;
}

function drive(raw: string, category: string): CatalogVehicle["drive"] | null {
  const v = raw.toLowerCase();
  if (v.startsWith("front")) return Drive.FWD;
  if (v.startsWith("rear")) return Drive.RWD;
  // car2db writes "Four wheel drive (4WD)" for permanent AWD (quattro, xDrive) as well as
  // part-time 4×4: commercial vehicles (pickups) are 4×4, cars AWD.
  if (/four|all|full|4wd|awd/.test(v)) return category === VehicleCategory.CAR ? Drive.AWD : Drive.FOUR_WD;
  return null;
}

/**
 * "1 generation (8U) [restyling]" → name "I facelift", code "8U"; "F3" → name
 * "F3", code "F3"; "8P/8PA [2th restyling]" → "8P/8PA facelift 2". `stage`
 * counts facelifts (0: none), so both car2db naming schemes of one generation
 * share a code and stage.
 */
export function generationName(raw: string): { name: string; code: string | null; stage: number } {
  const restyling = raw.match(/\[(?:(\d+)\w*\s+)?restyling\]/i);
  const stage = restyling ? Number(restyling[1] ?? 1) : 0;
  const base = raw.replace(/\[[^\]]*\]/g, "").trim();
  const numbered = base.match(/^(\d+)\s*generation\s*(?:\(([^)]+)\))?/i);
  const roman = (n: number) => ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] ?? String(n);
  const name = numbered ? roman(Number(numbered[1])) : base;
  const code = numbered ? (numbered[2] ?? null) : /^[A-Z0-9]{1,6}(\/[A-Z0-9]{1,6})*$/.test(base) ? base : null;
  const suffix = stage === 0 ? "" : stage === 1 ? " facelift" : ` facelift ${stage}`;
  return { name: `${name}${suffix}`, code, stage };
}

/** "35 TDI MT quattro (150 hp)" → "35 TDI MT quattro". */
const trimName = (raw: string) => raw.replace(/\s*\(\d+\s*hp\)\s*$/i, "").trim() || null;

export function car2dbToCatalog(input: {
  make: string;
  models: Car2dbModelData[];
  retrievedAt: string;
  thisYear?: number;
}): { file: CatalogFile; issues: MappingIssue[] } {
  const thisYear = input.thisYear ?? new Date().getFullYear();
  const issues: MappingIssue[] = [];
  const models: CatalogFile["makes"][number]["models"] = [];

  for (const data of input.models) {
    const genById = new Map(data.generations.map((g) => [g.id, g]));
    const genOfSeries = new Map(data.series.map((s) => [s.id, s.generationId]));
    const generations = new Map<string, CatalogGeneration & { keys: Map<string, CatalogVehicle[]> }>();

    for (const trim of data.trims) {
      const problems: string[] = [];
      const fail = (problem: string) => problems.push(problem);
      const report = () =>
        problems.length && issues.push({ model: `${input.make} ${data.model.name}`, trim: trim.name, problem: problems.join("; ") });
      const gen = genById.get(genOfSeries.get(trim.seriesId) ?? -1);
      if (!gen) {
        fail("no generation");
        report();
        continue;
      }
      const spec = (name: string) => trim.specificationValues?.find((s) => s.specificationName === name)?.value?.trim();
      const genStart = year(gen.yearBegin, thisYear);
      if (genStart == null) {
        fail(`generation "${gen.name}" has no first year`);
        report();
        continue;
      }
      // An end year in the future (or this year) means "still produced".
      const genEndRaw = year(gen.yearEnd, thisYear);
      const genEnd = genEndRaw != null && genEndRaw < thisYear ? genEndRaw : null;

      const fuelRaw = (spec("Engine type") ?? "").toLowerCase();
      const fuel = FUEL[fuelRaw];
      // Power: the spec, else the trim name ("35 TDI (150 hp)").
      const power = Number(spec("Engine power")) || Number(trim.name.match(/\((\d+)\s*hp\)/i)?.[1]);
      const bodyRaw = spec("Body type") ?? "";
      const shape = body(bodyRaw);
      const transmission = TRANSMISSION[(spec("Gearbox type") ?? "").toLowerCase()];
      const wheels = drive(spec("Drive wheels") ?? "", data.model.category);
      if (!fuel) fail(`unknown engine type "${fuelRaw}"`);
      if (!Number.isFinite(power) || power <= 0) fail("no engine power");
      if (!shape) fail(`unknown body type "${bodyRaw}"`);
      if (!transmission) fail(`unknown gearbox "${spec("Gearbox type") ?? ""}"`);
      if (!wheels) fail(`unknown drive "${spec("Drive wheels") ?? ""}"`);
      if (!fuel || !(power > 0) || !shape || !transmission || !wheels) {
        report();
        continue;
      }

      const capacity = Number(spec("Capacity"));
      const cylinders = Number(spec("Number of cylinders"));
      const electric = fuel === FuelType.ELECTRIC;
      const layoutRaw = (spec("Cylinder layout") ?? "").toLowerCase();
      // Years: the trim's when given, kept within its generation.
      let start = year(trim.startProductionYear, thisYear) ?? genStart;
      let end = year(trim.endProductionYear, thisYear) ?? genEnd;
      start = Math.max(start, genStart);
      if (genEnd != null && start > genEnd) {
        fail(`years (${start}–) outside its generation "${gen.name}" (${genStart}–${genEnd})`);
        report();
        continue;
      }
      if (genEnd != null) end = end == null ? genEnd : Math.min(end, genEnd);
      if (end != null && end < start) end = start;

      const vehicle: CatalogVehicle = {
        engine: {
          code: null,
          fuel,
          layout: electric ? EngineLayout.ELECTRIC_MOTOR : (LAYOUT[layoutRaw] ?? null),
          cylinders: !electric && cylinders > 0 && cylinders <= 16 ? cylinders : null,
          displacement_cc: !electric && capacity >= 50 && capacity <= 20000 ? capacity : null,
          power_kw: psToKw(power),
        },
        body_style: shape.body_style,
        doors: Math.min(Math.max(shape.doors, 2), 6),
        drive: wheels,
        transmission,
        trim: trimName(trim.name),
        year_start: start,
        year_end: end,
        references: [{ source: VehicleReferenceSource.OTHER, external_id: `car2db:trim:${trim.id}` }],
      };

      // car2db lists some generations twice ("1 generation (8U)" and "8U"):
      // one entry per code (else name) and facelift stage, numbered name preferred.
      const { name, code, stage } = generationName(gen.name);
      const groupKey = `${(code ?? name).toLowerCase()}|${stage}`;
      let entry = generations.get(groupKey);
      if (!entry) {
        entry = { name, code, year_start: genStart, year_end: genEnd, vehicles: [], source: `car2db:generation:${gen.id}`, keys: new Map<string, CatalogVehicle[]>() };
        generations.set(groupKey, entry);
      } else {
        if (/generation/i.test(gen.name) && !/^[IVX]+\b/.test(entry.name)) entry.name = name;
        entry.year_start = Math.min(entry.year_start, genStart);
        entry.year_end = entry.year_end == null || genEnd == null ? null : Math.max(entry.year_end, genEnd);
      }
      // Same configuration (the overlap constraint's columns) more than once:
      // equipment variants with overlapping years merge into one (widest
      // years, first reference); a later, separate period stays its own.
      const key = JSON.stringify([vehicle.engine, vehicle.body_style, vehicle.doors, vehicle.drive, vehicle.transmission, (vehicle.trim ?? "").toLowerCase()]);
      const same = entry.keys.get(key) ?? [];
      const overlapping = same.find((o) => o.year_start <= (vehicle.year_end ?? Infinity) && vehicle.year_start <= (o.year_end ?? Infinity));
      if (overlapping) {
        overlapping.year_start = Math.min(overlapping.year_start, vehicle.year_start);
        overlapping.year_end = overlapping.year_end == null || vehicle.year_end == null ? null : Math.max(overlapping.year_end, vehicle.year_end);
        continue;
      }
      entry.keys.set(key, [...same, vehicle]);
      entry.vehicles.push(vehicle);
    }

    // Generation names must be unique within a model (car2db repeats names across schemes).
    const byName = new Map<string, number>();
    const gens = [...generations.values()]
      .sort((a, b) => a.year_start - b.year_start)
      .map(({ keys: _keys, ...g }) => {
        const seen = byName.get(g.name.toLowerCase()) ?? 0;
        byName.set(g.name.toLowerCase(), seen + 1);
        return seen ? { ...g, name: `${g.name} (${g.year_start})` } : g;
      });
    if (gens.length) models.push({ name: data.model.name, category: data.model.category as any, generations: gens });
  }

  return {
    file: {
      format: "vehicle-catalog@1",
      market: "TN",
      source: {
        name: "car2db",
        url: "https://car2db.com",
        license: "car2db API subscription (commercial use per car2db terms)",
        retrieved_at: input.retrievedAt,
        tier: SourceTier.LICENSED,
      },
      makes: [{ name: input.make, models }],
    },
    issues,
  };
}
