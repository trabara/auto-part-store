import { z } from "@medusajs/framework/zod";
import { defineEntity, fields, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import "@repo/framework/medusa";

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum FuelType {
  GASOLINE = "GASOLINE",
  DIESEL = "DIESEL",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
  PLUG_IN_HYBRID = "PLUG_IN_HYBRID",
  LPG = "LPG",
  CNG = "CNG",
  HYDROGEN = "HYDROGEN",
}
export const FuelTypeSchema = z.enum(FuelType);

/** Cylinder arrangement; ELECTRIC_MOTOR for battery-electric drives. */
export enum EngineLayout {
  INLINE = "INLINE",
  V = "V",
  BOXER = "BOXER",
  W = "W",
  ROTARY = "ROTARY",
  ELECTRIC_MOTOR = "ELECTRIC_MOTOR",
}
export const EngineLayoutSchema = z.enum(EngineLayout);

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
  DUAL_CLUTCH = "DUAL_CLUTCH",
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
  MINIVAN = "MINIVAN",
  VAN = "VAN",
  PICKUP = "PICKUP",
  CHASSIS_CAB = "CHASSIS_CAB",
  MOTORCYCLE = "MOTORCYCLE",
}
export const BodyStyleSchema = z.enum(BodyStyle);

export enum VehicleCategory {
  CAR = "CAR",
  /** Light commercial vehicle (vans, pickups up to 3.5 t). */
  LCV = "LCV",
  TRUCK = "TRUCK",
  MOTORCYCLE = "MOTORCYCLE",
}

/** Catalogs a vehicle can be identified in. */
export enum VehicleReferenceSource {
  TECDOC_KTYPE = "TECDOC_KTYPE",
  ACES_VEHICLE_ID = "ACES_VEHICLE_ID",
  ACES_BASE_VEHICLE = "ACES_BASE_VEHICLE",
  OTHER = "OTHER",
}

// ── Shared fields ─────────────────────────────────────────────────────────────

/** First production car (1886) up to announced model years. */
export const YearSchema = z
  .number()
  .int()
  .min(1886)
  .max(new Date().getFullYear() + 2);

const years = (r: { year_start?: number; year_end?: number | null }) =>
  r.year_start ? `${r.year_start}–${r.year_end ?? ""}` : "";

const YEAR_CHECKS = (table: string) => [
  { name: `${table}_year_range_check`, expression: "year_end IS NULL OR year_end >= year_start" },
  // Static bounds (CHECK can't use now()); the schema enforces the moving max.
  { name: `${table}_year_bounds_check`, expression: "year_start BETWEEN 1886 AND 2100" },
];

const YEAR_MESSAGES = (table: string) => ({
  [`${table}_year_range_check`]: "The last production year can't be before the first.",
  [`${table}_year_bounds_check`]: "The first production year must be between 1886 and 2100.",
});

// ── Make › Model › Generation ─────────────────────────────────────────────────

export const VehicleMake = defineEntity("VehicleMake", {
  schema: BaseSchema.extend({
    name: z.string().describe("The name of the vehicle make, e.g., Toyota, Ford, etc."),
    slug: z.string().slugify().nullable().describe(""),
    logo: fields.image().describe("Brand logo"),
  }),
  relations: (r) => ({
    models: r.hasMany("VehicleModel", { mappedBy: "make" }),
  }),
  // Unique on lower(name): hand-written index (migration 20261006…), DML
  // indexes can't hold expressions.
});

export const VehicleModel = defineEntity("VehicleModel", {
  schema: BaseSchema.extend({
    name: z.string().describe("The name of the vehicle model, e.g., Camry, F-150, etc."),
    slug: z.string().slugify().nullable().describe(""),
    image: fields.image().describe("Model image"),
    category: z.enum(VehicleCategory).default(VehicleCategory.CAR).describe("Car, light commercial, truck or motorcycle"),
  }),
  relations: (r) => ({
    make: r.belongsTo("VehicleMake", { mappedBy: "models" }),
    generations: r.hasMany("VehicleGeneration", { mappedBy: "model" }),
  }),
  // Unique on (make_id, lower(name)): model names repeat across makes (Ford /
  // GMC Sierra). Hand-written index (migration 20261006…).
  // Medusa's error parser reports only `name` for that expression index.
  messages: {
    unique: [{ on: ["name"], message: "This make already has a model with this name." }],
  },
});

/** A model's generation / series: "Golf Mk7 (5G1)", "3 Series E90". */
export const VehicleGeneration = defineEntity("VehicleGeneration", {
  schema: BaseSchema.extend({
    name: z.string().trim().min(1).describe("Generation name, e.g. Mk7, E90, XV70"),
    code: z.string().trim().nullable().describe("Manufacturer / catalog series code, e.g. 5G1"),
    year_start: YearSchema.describe("First production year"),
    year_end: YearSchema.nullable().describe("Last production year (empty: still produced)"),
    image: fields.image().describe("Generation image"),
  }),
  relations: (r) => ({
    model: r.belongsTo("VehicleModel", { mappedBy: "generations" }),
    vehicles: r.hasMany("Vehicle", { mappedBy: "generation" }),
  }),
  indexes: [{ name: "vehicle_generation_unique", on: ["model_id", "name"], unique: true }],
  checks: YEAR_CHECKS("vehicle_generation"),
  messages: {
    unique: [{ on: ["model_id", "name"], message: "This model already has a generation with this name." }],
    constraints: YEAR_MESSAGES("vehicle_generation"),
  },
  // "Volkswagen Golf Mk7 (5G1) 2012–2020"
  label: {
    fields: ["name", "code", "year_start", "year_end", "model.name", "model.make.name"],
    format: (g) =>
      [g.model?.make?.name, g.model?.name, g.name, g.code ? `(${g.code})` : "", years(g)]
        .filter(Boolean)
        .join(" "),
  },
});

// ── Engine ────────────────────────────────────────────────────────────────────

const LAYOUT_PREFIX: Record<EngineLayout, string> = {
  INLINE: "I",
  V: "V",
  BOXER: "H",
  W: "W",
  ROTARY: "R",
  ELECTRIC_MOTOR: "",
};

type EngineLabelRow = {
  displacement_cc?: number | null;
  fuel?: FuelType;
  layout?: EngineLayout | null;
  cylinders?: number | null;
  power_kw?: number;
  power_hp?: number;
  code?: string | null;
};

/** "2.0 diesel I4 110 kW (150 hp) CJSA", "electric 150 kW (201 hp)" */
export const engineLabel = (e: EngineLabelRow) =>
  [
    e.displacement_cc ? (e.displacement_cc / 1000).toFixed(1) : "",
    e.fuel ? e.fuel.toLowerCase().replace(/_/g, "-") : "",
    e.layout && e.layout !== EngineLayout.ELECTRIC_MOTOR ? `${LAYOUT_PREFIX[e.layout]}${e.cylinders ?? ""}` : "",
    e.power_kw != null ? `${e.power_kw} kW${e.power_hp != null ? ` (${e.power_hp} hp)` : ""}` : "",
    e.code ?? "",
  ]
    .filter(Boolean)
    .join(" ");

export const VehicleEngine = defineEntity("VehicleEngine", {
  schema: BaseSchema.extend({
    code: z.string().trim().toUpperCase().nullable().describe("Manufacturer engine code, e.g. CJSA"),
    fuel: FuelTypeSchema.default(FuelType.GASOLINE).describe("Fuel / energy"),
    layout: EngineLayoutSchema.nullable().describe("Cylinder arrangement (electric motor for EVs)"),
    cylinders: z.number().int().min(1).max(16).nullable().describe("Number of cylinders"),
    displacement_cc: z.number().int().min(50).max(20000).nullable().describe("Displacement in cm³ (empty for EVs)"),
    power_kw: z.number().int().min(1).max(2000).describe("Power in kW"),
    power_hp: z.number().int().describe("Power in hp, derived from kW"),
    name: z.string().optional().describe("Technology, e.g. TDI, EcoBoost, turbo"),
  }),
  relations: (r) => ({
    vehicles: r.hasMany("Vehicle", { mappedBy: "engine" }),
  }),
  derived: { power_hp: { from: ["power_kw"], compute: (e) => Math.round(e.power_kw * 1.34102) } },
  // Unique on (fuel, layout, cylinders, displacement_cc, power_kw, code)
  // NULLS NOT DISTINCT: hand-written index (migration).
  messages: {
    unique: [
      {
        on: ["fuel", "layout", "cylinders", "displacement_cc", "power_kw", "code"],
        message: "An engine with these specifications already exists.",
      },
    ],
  },
  label: {
    fields: ["displacement_cc", "fuel", "layout", "cylinders", "power_kw", "power_hp", "code"],
    format: engineLabel,
  },
});

// ── Vehicle (configuration) ───────────────────────────────────────────────────

/**
 * One configuration of a generation: engine, body, drive, transmission, trim
 * and production years. Configurations with the same specifications can't
 * overlap in years (exclusion constraint, migration), and must fall within
 * their generation's years (hook).
 */
export const Vehicle = defineEntity("Vehicle", {
  schema: BaseSchema.extend({
    body_style: BodyStyleSchema.default(BodyStyle.SEDAN).describe("Body style"),
    doors: z.number().int().min(2).max(6).default(4).describe("Number of doors"),
    drive: DriveSchema.default(Drive.FWD).describe("Drive system"),
    transmission: TransmissionSchema.default(Transmission.MANUAL).describe("Transmission"),
    trim: z.string().trim().nullable().describe("Trim / submodel, e.g. Highline, GTI"),
    year_start: YearSchema.describe("First production year"),
    year_end: YearSchema.nullable().describe("Last production year (empty: still produced)"),
  }),
  relations: (r) => ({
    generation: r.belongsTo("VehicleGeneration", { mappedBy: "vehicles" }),
    engine: r.belongsTo("VehicleEngine", { mappedBy: "vehicles" }),
    references: r.hasMany("VehicleReference", { mappedBy: "vehicle" }),
  }),
  checks: YEAR_CHECKS("vehicle"),
  messages: {
    constraints: {
      ...YEAR_MESSAGES("vehicle"),
      vehicle_configuration_overlap:
        "A vehicle with the same generation, engine and specifications already covers some of these years.",
    },
  },
  // "Volkswagen Golf Mk7 Highline 2015–2020 · 2.0 diesel I4 110 kW (150 hp)"
  label: {
    fields: [
      "trim",
      "year_start",
      "year_end",
      "generation.name",
      "generation.model.name",
      "generation.model.make.name",
      ...["displacement_cc", "fuel", "layout", "cylinders", "power_kw", "power_hp", "code"].map((f) => `engine.${f}`),
    ],
    format: (v) => {
      const g = v.generation;
      const name = [g?.model?.make?.name, g?.model?.name, g?.name, v.trim].filter(Boolean).join(" ");
      const engine = v.engine ? engineLabel(v.engine) : "";
      return name ? [`${name} ${years(v)}`.trim(), engine].filter(Boolean).join(" · ") : "";
    },
  },
});

/** A vehicle's id in an external catalog (TecDoc KType, ACES VehicleID, …). */
export const VehicleReference = defineEntity("VehicleReference", {
  schema: BaseSchema.extend({
    source: z.enum(VehicleReferenceSource).describe("Catalog"),
    external_id: z.string().trim().min(1).describe("The vehicle's id in that catalog"),
  }),
  relations: (r) => ({
    vehicle: r.belongsTo("Vehicle", { mappedBy: "references" }),
  }),
  indexes: [{ name: "vehicle_reference_unique", on: ["source", "external_id"], unique: true }],
  messages: {
    unique: [{ on: ["source", "external_id"], message: "This catalog id already belongs to a vehicle." }],
  },
  label: { fields: ["source", "external_id"], format: (r) => `${r.source}: ${r.external_id}` },
});

// ── Customer garage ───────────────────────────────────────────────────────────

/** A vehicle a customer owns ("my vehicles"): the storefront filters parts by it. */
export const CustomerVehicle = defineEntity("CustomerVehicle", {
  schema: BaseSchema.extend({
    nickname: z.string().trim().nullable().describe("Customer's name for it, e.g. Work van"),
    vin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "A VIN has 17 letters and digits (no I, O or Q)")
      .nullable()
      .describe("Vehicle identification number"),
    registration: z.string().trim().toUpperCase().nullable().describe("Registration plate"),
    is_default: z.boolean().default(false).describe("The customer's default vehicle"),
    // Narrows fitments with a production window ("from 03/2018").
    build_year: YearSchema.nullable().optional().describe("Build year, if known"),
    build_month: z.number().int().min(1).max(12).nullable().optional().describe("Build month, if known"),
  }),
  relations: (r) => ({
    customer: r.link("Customer", { storage: "column" }),
    vehicle: r.belongsTo("Vehicle"),
  }),
  checks: [{ name: "customer_vehicle_build_month_check", expression: "build_month IS NULL OR build_year IS NOT NULL" }],
  messages: { constraints: { customer_vehicle_build_month_check: "A build month needs a build year." } },
  label: {
    fields: ["nickname", "registration"],
    format: (c) => [c.nickname, c.registration].filter(Boolean).join(" · "),
  },
});

export type VehicleMake = InferEntity<typeof VehicleMake>;
export type VehicleModel = InferEntity<typeof VehicleModel>;
export type VehicleGeneration = InferEntity<typeof VehicleGeneration>;
export type VehicleEngine = InferEntity<typeof VehicleEngine>;
export type Vehicle = InferEntity<typeof Vehicle>;
export type VehicleReference = InferEntity<typeof VehicleReference>;
export type CustomerVehicle = InferEntity<typeof CustomerVehicle>;
