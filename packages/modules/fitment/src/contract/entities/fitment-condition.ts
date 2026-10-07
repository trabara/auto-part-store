import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { FitmentConditionOperator } from "./enums";

export const FitmentCondition = defineEntity("FitmentCondition", {
  schema: BaseSchema.extend({
    operator: z.enum(FitmentConditionOperator).describe("The operator of the fitment condition"),
    rank: z.number().int().default(0).describe("Order within its group"),
    value: z.string().describe("The value of the fitment condition"),
    value_to: z
      .string()
      .nullable()
      .describe("The second value of the fitment condition, used for range comparisons"),
    unit: z
      .string()
      .nullable()
      .describe("The unit of the fitment condition, e.g., 'inches', 'cm', etc."),
  }),
  relations: (r) => ({
    group: r.belongsTo("FitmentConditionGroup", { mappedBy: "conditions" }),
    attribute: r.belongsTo("AutomotiveAttribute"),
  }),
});

export type FitmentCondition = InferEntity<typeof FitmentCondition>;
