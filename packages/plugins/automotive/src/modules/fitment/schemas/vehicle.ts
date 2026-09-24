import { z } from "@medusajs/framework/zod";
import { BaseSchema, Model, ModelSchema } from "./base";
import { VehicleModel, VehicleModelSchema } from "./model";
import { VehicleEngine, VehicleEngineSchema } from "./engine";

export enum Drive {
  FWD,
  RWD,
  AWD,
  FOUR_WD,
}
export const DriveSchema = z.enum(Drive);

export enum Transmission {
  MANUAL,
  AUTOMATIC,
  CVT,
}
export const TransmissionSchema = z.enum(Transmission);

export enum BodyStyle {
  SEDAN,
  SUV,
  HATCHBACK,
  COUPE,
  CONVERTIBLE,
  WAGON,
  VAN,
  PICKUP,
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
