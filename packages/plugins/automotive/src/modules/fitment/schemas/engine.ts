import { z } from "@medusajs/framework/zod";
import { BaseSchema, Model, ModelSchema } from "./base";
import { Vehicle, VehicleSchema } from "./vehicle";

export enum FuelType {
  GASOLINE,
  DIESEL,
  ELECTRIC,
  HYBRID,
}
export const FuelTypeSchema = z.enum(FuelType);

export enum EngineType {
  I4,
  V4,
  V6,
  V8,
  ELECTRIC,
  HYBRID,
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
    vehicles: z.array(VehicleSchema),
  });
