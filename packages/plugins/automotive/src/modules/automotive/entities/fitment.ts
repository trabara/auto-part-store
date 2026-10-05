import type { InferEntityType } from "@medusajs/framework/types";
import { z } from "@medusajs/framework/zod";
import { defineEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum DataType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  ENUM = "enum",
  ARRAY = "array",
  OBJECT = "object",
}

export enum FitmentConditionOperator {
  EQ = "eq",
  NEQ = "neq",
  GT = "gt",
  GTE = "gte",
  LT = "lt",
  LTE = "lte",
  BETWEEN = "between",
  IN = "in",
  NOT_IN = "not_in",
}

export enum FitmentConditionGroupOperator {
  AND = "and",
  OR = "or",
}

// ── Entities ──────────────────────────────────────────────────────────────────

export const AutomotiveAttribute = defineEntity("AutomotiveAttribute", {
  schema: BaseSchema.extend({
    code: z
      .string()
      .describe("The code of the automotive attribute, e.g., 'engine_size', 'fuel_type', etc."),
    name: z
      .string()
      .describe("The name of the automotive attribute, e.g., 'Engine Size', 'Fuel Type', etc."),
    dataType: z
      .enum(DataType)
      .describe("The data type of the automotive attribute, e.g., 'string', 'number', etc."),
    defaultUnit: z
      .string()
      .nullable()
      .describe("The default unit of the automotive attribute, e.g., 'inches', 'cm', etc."),
    category: z
      .string()
      .nullable()
      .describe("The category of the automotive attribute, e.g., 'Engine', 'Transmission', etc."),
  }),
});

export const FitmentPosition = defineEntity("FitmentPosition", {
  schema: BaseSchema.extend({
    code: z
      .string()
      .describe("The code of the fitment position, e.g., 'FRONT_LEFT', 'REAR_RIGHT', etc."),
    name: z
      .string()
      .describe("The name of the fitment position, e.g., 'Front Left', 'Rear Right', etc."),
    category: z
      .string()
      .nullable()
      .describe("The category of the fitment position, e.g., 'Front', 'Rear', etc."),
  }),
  relations: (r) => ({
    fitments: r.hasMany("Fitment", { mappedBy: "position" }),
  }),
});

export const Fitment = defineEntity("Fitment", {
  schema: BaseSchema.extend({
    notes: z.string().nullable().describe("Additional notes about the fitment"),
  }),
  relations: (r) => ({
    vehicle: r.belongsTo("Vehicle"),
    position: r.belongsTo("FitmentPosition", { mappedBy: "fitments" }),
    conditionGroups: r.hasMany("FitmentConditionGroup", { mappedBy: "fitment" }),
  }),
});

export const FitmentConditionGroup = defineEntity("FitmentConditionGroup", {
  schema: BaseSchema.extend({
    operator: z
      .enum(FitmentConditionGroupOperator)
      .describe("The operator of the condition group"),
  }),
  relations: (r) => ({
    fitment: r.belongsTo("Fitment", { mappedBy: "conditionGroups" }),
    conditions: r.hasMany("FitmentCondition", { mappedBy: "group" }),
    children: r.hasMany("FitmentConditionGroup", { mappedBy: "parent" }),
    parent: r.belongsTo("FitmentConditionGroup", { mappedBy: "children", nullable: true }),
  }),
});

export const FitmentCondition = defineEntity("FitmentCondition", {
  schema: BaseSchema.extend({
    operator: z.enum(FitmentConditionOperator).describe("The operator of the fitment condition"),
    value: z.string().describe("The value of the fitment condition"),
    valueTo: z
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

export type AutomotiveAttribute = InferEntityType<typeof AutomotiveAttribute.model>;
export type FitmentPosition = InferEntityType<typeof FitmentPosition.model>;
export type Fitment = InferEntityType<typeof Fitment.model>;
export type FitmentConditionGroup = InferEntityType<typeof FitmentConditionGroup.model>;
export type FitmentCondition = InferEntityType<typeof FitmentCondition.model>;
