import * as z from "@medusajs/framework/zod";
import { BaseSchema } from "./base";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const FuelTypeSchema = z.enum([
  "GASOLINE",
  "DIESEL",
  "ELECTRIC",
  "HYBRID",
])

export const DriveTypeSchema = z.enum(["FWD", "RWD", "AWD", "FOUR_WD"])

export const TransmissionTypeSchema = z.enum(["MANUAL", "AUTOMATIC", "CVT"])

export const BodyStyleTypeSchema = z.enum([
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "COUPE",
  "CONVERTIBLE",
  "WAGON",
  "VAN",
  "PICKUP",
])

export const EngineTypeSchema = z.enum([
  "I4",
  "V4",
  "V6",
  "V8",
  "ELECTRIC",
  "HYBRID",
]).describe("The type of engine");

// ── Entity shape schemas ──────────────────────────────────────────────────────

export const MakeSchema = BaseSchema.extend({
  name: z.string().describe("The name of the vehicle make, e.g., Toyota, Ford, etc."),
});

export const ModelSchema = BaseSchema.extend({
  name: z.string().describe("The name of the vehicle model, e.g., Camry, F-150, etc."),
  make: MakeSchema,
});

export const EngineSchema = BaseSchema.extend({
  fuel: FuelTypeSchema.default("GASOLINE").describe("The type of fuel used by the engine"),
  type: EngineTypeSchema.default("I4").describe("The type of engine"),
  size: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .default("1.0")
    .describe("The size of the engine in liters"),
  tech: z.string().optional().describe("The technology used in the engine, e.g., turbocharged, supercharged"),
  // fitments: z.array(z.lazy(() => FitmentSchema)).optional(),
});

export const FitmentSchema = BaseSchema.extend({
  body_style: BodyStyleTypeSchema.default("SEDAN").describe("The body style of the vehicle"),
  doors: z.number().min(2).max(6).default(4).describe("The number of doors on the vehicle"),
  drive: DriveTypeSchema.default("FWD").describe("The type of drive system"),
  transmission: TransmissionTypeSchema.default("MANUAL").describe("The type of transmission"),
  year_start: z.number().describe("The starting year of the fitment"),
  year_end: z.number().optional().describe("The ending year of the fitment"),
});
