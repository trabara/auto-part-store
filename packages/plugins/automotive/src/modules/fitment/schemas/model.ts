import { z } from "@medusajs/framework/zod";
import { BaseSchema, Model, ModelSchema } from "./base";
import { VehicleMake, VehicleMakeSchema } from "./make";
import { VehicleSchema } from "./vehicle";

export type VehicleModel = Model<{
  name: string;
  slug?: string;
  make: VehicleMake;
}>;

export const VehicleModelSchema: ModelSchema<VehicleModel> = BaseSchema.extend({
  name: z
    .string()
    .describe("The name of the vehicle model, e.g., Camry, F-150, etc."),
  slug: z.string().describe(""),
  make: z.lazy(() => VehicleMakeSchema),
  vehicles: z.array(VehicleSchema),
});
