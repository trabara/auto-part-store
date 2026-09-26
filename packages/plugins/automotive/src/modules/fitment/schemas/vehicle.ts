import { z } from "@medusajs/framework/zod";
import { BaseSchema, Model, ModelSchema } from "./base";

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

export const EngineTypeSchema = z
  .enum(EngineType)
  .describe("The type of engine");

export type VehicleEngine = Model<{
  fuel: FuelType;
  type: EngineType;
  size: string;
  power: number;
  name?: string;
  // vehicles: Vehicle[];
}>;

export const VehicleEngineSchema: ModelSchema<VehicleEngine> =
  BaseSchema.extend({
    fuel: FuelTypeSchema.default(FuelType.GASOLINE).describe(
      "The type of fuel used by the engine",
    ),
    type: EngineTypeSchema.default(EngineType.ELECTRIC).describe(
      "The type of engine",
    ),
    size: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .default("1.0")
      .describe("The size of the engine in liters"),
    power: z.number(),
    name: z
      .string()
      .optional()
      .describe(
        "The technology used in the engine, e.g., turbocharged, supercharged",
      ),
    vehicles: z.lazy(() => z.array(VehicleSchema)),
  });

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

export type Vehicle = Model<{
  model: VehicleModel;
  engine: VehicleEngine;
  body_style: BodyStyle;
  doors: number;
  drive: Drive;
  transmission: Transmission;
  year_start: number;
  year_end?: number;
}>;

export type VehicleMake = Model<{
  name: string;
  slug: string | null;
}>;

export const VehicleMakeSchema: ModelSchema<VehicleMake> = BaseSchema.extend({
  name: z
    .string()
    .describe("The name of the vehicle make, e.g., Toyota, Ford, etc."),
  slug: z.string().slugify().nullable().describe(""),
  models: z.lazy(() => z.array(VehicleModelSchema)),
});

export type VehicleModel = Model<{
  name: string;
  slug: string | null;
  make: VehicleMake;
}>;

export const VehicleModelSchema: ModelSchema<VehicleModel> = BaseSchema.extend({
  name: z
    .string()
    .describe("The name of the vehicle model, e.g., Camry, F-150, etc."),
  slug: z.string().slugify().nullable().describe(""),
  make: z.lazy(() => VehicleMakeSchema),
  vehicles: z.lazy(() => z.array(VehicleSchema)),
});

export const VehicleSchema: ModelSchema<Vehicle> = BaseSchema.extend({
  body_style: BodyStyleSchema.default(BodyStyle.SEDAN).describe(
    "The body style of the vehicle",
  ),
  doors: z
    .number()
    .min(2)
    .max(6)
    .default(4)
    .describe("The number of doors on the vehicle"),
  drive: DriveSchema.default(Drive.FWD).describe("The type of drive system"),
  transmission: TransmissionSchema.default(Transmission.MANUAL).describe(
    "The type of transmission",
  ),
  year_start: z.number().describe("The starting year of the fitment"),
  year_end: z.number().optional().describe("The ending year of the fitment"),
  model: VehicleModelSchema,
  engine: VehicleEngineSchema,
});
