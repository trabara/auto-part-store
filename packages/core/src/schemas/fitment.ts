import * as z from "@medusajs/framework/zod";
import { BaseSchema } from "./base";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const FuelTypeSchema = z.enum([
  "GASOLINE",
  "DIESEL",
  "ELECTRIC",
  "HYBRID",
]);

export const DriveTypeSchema = z.enum(["FWD", "RWD", "AWD", "FOUR_WD"]);

export const TransmissionTypeSchema = z.enum(["MANUAL", "AUTOMATIC", "CVT"]);

export const BodyStyleTypeSchema = z.enum([
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "COUPE",
  "CONVERTIBLE",
  "WAGON",
  "VAN",
  "PICKUP",
]);

export const EngineTypeSchema = z.enum([
  "I4",
  "V4",
  "V6",
  "V8",
  "ELECTRIC",
  "HYBRID",
]);

// ── Entity shape schemas ──────────────────────────────────────────────────────

export const MakeSchema = BaseSchema.extend({
  name: z.string(),
});

export const ModelSchema = BaseSchema.extend({
  name: z.string(),
  make: MakeSchema,
});

export const EngineSchema = BaseSchema.extend({
  fuel: FuelTypeSchema.default("GASOLINE"),
  type: EngineTypeSchema.default("I4"),
  size: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .default("1.0"),
  tech: z.string().optional(),
});

export const FitmentSchema = BaseSchema.extend({
  body_style: BodyStyleTypeSchema.default("SEDAN"),
  doors: z.number().min(2).max(6).default(4),
  drive: DriveTypeSchema.default("FWD"),
  transmission: TransmissionTypeSchema.default("MANUAL"),
  year_start: z.number(),
  year_end: z.number().optional(),
});
