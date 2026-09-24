import { z } from "@medusajs/framework/zod";
import { BaseSchema, Model, ModelSchema } from "./base";
import { VehicleModelSchema } from "./model";

export type VehicleMake = Model<{
  name: string;
  slug?: string;
}>;

export const VehicleMakeSchema: ModelSchema<VehicleMake> = BaseSchema.extend({
  name: z
    .string()
    .describe("The name of the vehicle make, e.g., Toyota, Ford, etc."),
  slug: z.string().optional().describe(""),
  models: z.array(VehicleModelSchema).min(1).describe(""),
});
