import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { FitmentConditionGroupOperator } from "./enums";

export const FitmentConditionGroup = defineEntity("FitmentConditionGroup", {
  schema: BaseSchema.extend({
    operator: z
      .enum(FitmentConditionGroupOperator)
      .describe("The operator of the condition group"),
    rank: z.number().int().default(0).describe("Order among its siblings"),
  }),
  relations: (r) => ({
    fitment: r.belongsTo("Fitment", { mappedBy: "conditionGroups" }),
    conditions: r.hasMany("FitmentCondition", { mappedBy: "group" }),
    children: r.hasMany("FitmentConditionGroup", { mappedBy: "parent" }),
    parent: r.belongsTo("FitmentConditionGroup", { mappedBy: "children", nullable: true }),
  }),
});

export type FitmentConditionGroup = InferEntity<typeof FitmentConditionGroup>;
