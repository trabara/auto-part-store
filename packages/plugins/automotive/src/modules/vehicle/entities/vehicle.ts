import { z } from "@medusajs/framework/zod";
import { defineEntity, fields, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum FuelType {
  GASOLINE = "GASOLINE",
  DIESEL = "DIESEL",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
}
export const FuelTypeSchema = z.enum(FuelType);

export enum EngineType {
  I4 = "I4",
  V4 = "V4",
  V6 = "V6",
  V8 = "V8",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
}
export const EngineTypeSchema = z.enum(EngineType).describe("The type of engine");

export enum Drive {
  FWD = "FWD",
  RWD = "RWD",
  AWD = "AWD",
  FOUR_WD = "FOUR_WD",
}
export const DriveSchema = z.enum(Drive);

export enum Transmission {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
  CVT = "CVT",
}
export const TransmissionSchema = z.enum(Transmission);

export enum BodyStyle {
  SEDAN = "SEDAN",
  SUV = "SUV",
  HATCHBACK = "HATCHBACK",
  COUPE = "COUPE",
  CONVERTIBLE = "CONVERTIBLE",
  WAGON = "WAGON",
  VAN = "VAN",
  PICKUP = "PICKUP",
}
export const BodyStyleSchema = z.enum(BodyStyle);

// ── Entities ──────────────────────────────────────────────────────────────────

export const VehicleMake = defineEntity("VehicleMake", {
  schema: BaseSchema.extend({
    name: z.string().describe("The name of the vehicle make, e.g., Toyota, Ford, etc."),
    slug: z.string().slugify().nullable().describe(""),
    logo: fields.image().describe("Brand logo"),
  }),
  relations: (r) => ({
    models: r.hasMany("VehicleModel", { mappedBy: "make" }),
  }),
  indexes: [{ name: "vehicle_make_name_unique", on: ["name"], unique: true }],
});

export const VehicleModel = defineEntity("VehicleModel", {
  schema: BaseSchema.extend({
    name: z.string().describe("The name of the vehicle model, e.g., Camry, F-150, etc."),
    slug: z.string().slugify().nullable().describe(""),
    image: fields.image().describe("Model image"),
  }),
  relations: (r) => ({
    make: r.belongsTo("VehicleMake", { mappedBy: "models" }),
    vehicles: r.hasMany("Vehicle", { mappedBy: "model" }),
  }),
  indexes: [{ name: "vehicle_model_name_unique", on: ["name"], unique: true }],
});

type EngineLabelRow = { size?: string; type?: string; power?: number; name?: string | null };

/** "1.8 HYBRID 120 hp (Turbo)" */
const engineLabel = (e: EngineLabelRow) =>
  [e.size, e.type, e.power != null ? `${e.power} hp` : "", e.name ? `(${e.name})` : ""]
    .filter(Boolean)
    .join(" ");

export const VehicleEngine = defineEntity("VehicleEngine", {
  schema: BaseSchema.extend({
    fuel: FuelTypeSchema.default(FuelType.GASOLINE).describe(
      "The type of fuel used by the engine",
    ),
    type: EngineTypeSchema.default(EngineType.ELECTRIC).describe("The type of engine"),
    size: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .default("1.0")
      .describe("The size of the engine in liters"),
    power: z.number(),
    name: z
      .string()
      .optional()
      .describe("The technology used in the engine, e.g., turbocharged, supercharged"),
  }),
  relations: (r) => ({
    vehicles: r.hasMany("Vehicle", { mappedBy: "engine" }),
  }),
  indexes: [
    { name: "vehicle_engine_unique", on: ["fuel", "type", "size", "power"], unique: true },
  ],
  label: { fields: ["size", "type", "power", "name"], format: engineLabel },
});

export const Vehicle = defineEntity("Vehicle", {
  schema: BaseSchema.extend({
    body_style: BodyStyleSchema.default(BodyStyle.SEDAN).describe(
      "The body style of the vehicle",
    ),
    doors: z.number().min(2).max(6).default(4).describe("The number of doors on the vehicle"),
    drive: DriveSchema.default(Drive.FWD).describe("The type of drive system"),
    transmission: TransmissionSchema.default(Transmission.MANUAL).describe(
      "The type of transmission",
    ),
    year_start: z.number().describe("The starting year of the fitment"),
    year_end: z.number().nullable().describe("The ending year of the fitment"),
  }),
  relations: (r) => ({
    model: r.belongsTo("VehicleModel", { mappedBy: "vehicles" }),
    engine: r.belongsTo("VehicleEngine", { mappedBy: "vehicles" }),
  }),
  indexes: [
    {
      unique: true,
      on: [
        "model_id",
        "engine_id",
        "body_style",
        "doors",
        "drive",
        "transmission",
        "year_start",
        "year_end",
      ],
    },
  ],
  checks: [
    { name: "year_range_check", expression: "year_end IS NULL OR year_end >= year_start" },
  ],
  // "Toyota Corolla 2015–2020 · 1.8 HYBRID 120 hp"
  label: {
    fields: [
      "model.name",
      "model.make.name",
      "year_start",
      "year_end",
      "engine.size",
      "engine.type",
      "engine.power",
      "engine.name",
    ],
    format: (v) => {
      const name = [v.model?.make?.name, v.model?.name].filter(Boolean).join(" ");
      const years = `${v.year_start ?? ""}–${v.year_end ?? ""}`;
      const engine = v.engine ? engineLabel(v.engine) : "";
      return name ? [`${name} ${years}`, engine].filter(Boolean).join(" · ") : "";
    },
  },
});

export type VehicleMake = InferEntity<typeof VehicleMake>;
export type VehicleModel = InferEntity<typeof VehicleModel>;
export type VehicleEngine = InferEntity<typeof VehicleEngine>;
export type Vehicle = InferEntity<typeof Vehicle>;
