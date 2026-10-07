// Natural keys of catalog records: how an import recognizes what already
// exists (they follow the entities' unique indexes and constraints).
import type { CatalogEngine } from "../../contract/catalog";

const norm = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

export const makeKey = (make: string) => norm(make);
export const modelKey = (make: string, model: string) => `${makeKey(make)}/${norm(model)}`;
export const generationKey = (make: string, model: string, generation: string) =>
  `${modelKey(make, model)}/${norm(generation)}`;

/** An engine by specification (the engine unique index: fuel, layout, cylinders, cc, kW, code). */
export const engineKey = (e: Pick<CatalogEngine, "fuel" | "layout" | "cylinders" | "displacement_cc" | "power_kw" | "code">) =>
  [e.fuel, e.layout ?? "", e.cylinders ?? "", e.displacement_cc ?? "", e.power_kw, (e.code ?? "").trim().toUpperCase()].join("|");

/** A configuration: generation, engine, body, drive, transmission, trim and first year. */
export const vehicleKey = (
  generation: string,
  engine: string,
  v: { body_style: string; drive: string; transmission: string; trim: string | null; year_start: number },
) => [generation, engine, v.body_style, v.drive, v.transmission, norm(v.trim), v.year_start].join("|");
