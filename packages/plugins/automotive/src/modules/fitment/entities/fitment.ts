import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { Vehicle, VehicleEngine, YearSchema } from "../../vehicle/entities/vehicle";
import { ProductVariant } from "../../../entities/medusa";

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

// ── Condition attributes ──────────────────────────────────────────────────────

const ownFields = (schema: { shape: object }) =>
  Object.keys(schema.shape).filter((k) => !["id", "created_at", "updated_at", "deleted_at"].includes(k));

/**
 * Vehicle paths a condition can test (`drive`, `engine.fuel`, …). Load the
 * vehicle with these fields to evaluate fitments (`filterCompatible`).
 */
export const VEHICLE_ATTRIBUTE_PATHS: readonly string[] = [
  ...ownFields(Vehicle.schema),
  ...ownFields(VehicleEngine.schema).map((k) => `engine.${k}`),
  "model.name",
  "model.make.name",
];

const MonthSchema = z.number().int().min(1).max(12);

// ── Entities ──────────────────────────────────────────────────────────────────

export const AutomotiveAttribute = defineEntity("AutomotiveAttribute", {
  schema: BaseSchema.extend({
    // A vehicle path (drive, engine.fuel, …): what the condition tests.
    code: z
      .string()
      .trim()
      .toLowerCase()
      .refine((code) => VEHICLE_ATTRIBUTE_PATHS.includes(code), {
        message: `must be a vehicle field: ${VEHICLE_ATTRIBUTE_PATHS.join(", ")}`,
      })
      .describe("The code of the automotive attribute, e.g., 'engine_size', 'fuel_type', etc."),
    name: z
      .string()
      .describe("The name of the automotive attribute, e.g., 'Engine Size', 'Fuel Type', etc."),
    data_type: z
      .enum(DataType)
      .describe("The data type of the automotive attribute, e.g., 'string', 'number', etc."),
    default_unit: z
      .string()
      .nullable()
      .describe("The default unit of the automotive attribute, e.g., 'inches', 'cm', etc."),
    category: z
      .string()
      .nullable()
      .describe("The category of the automotive attribute, e.g., 'Engine', 'Transmission', etc."),
  }),
  indexes: [{ name: "automotive_attribute_code_unique", on: ["code"], unique: true }],
});

export const FitmentPosition = defineEntity("FitmentPosition", {
  schema: BaseSchema.extend({
    code: z
      .string()
      .trim()
      .toUpperCase()
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
  indexes: [{ name: "fitment_position_code_unique", on: ["code"], unique: true }],
});

/**
 * An application: this part (variant) fits this vehicle, optionally in a
 * position, a quantity per vehicle and a narrower production window, subject
 * to its condition groups. Unique per (variant, vehicle, position), including
 * a missing position (hand-written NULLS NOT DISTINCT index).
 */
export const Fitment = defineEntity("Fitment", {
  schema: BaseSchema.extend({
    quantity: z.number().int().min(1).default(1).describe("Units needed per vehicle"),
    from_year: YearSchema.nullable().describe("Fits from this production year (empty: the vehicle's)"),
    from_month: MonthSchema.nullable().describe("Fits from this month of from_year"),
    to_year: YearSchema.nullable().describe("Fits up to this production year (empty: the vehicle's)"),
    to_month: MonthSchema.nullable().describe("Fits up to this month of to_year"),
    notes: z.string().nullable().describe("Additional notes about the fitment"),
  }),
  relations: (r) => ({
    // Ids stored on the fitment, resolved by read-only links (src/links/).
    variant: r.link("ProductVariant", { storage: "column" }),
    vehicle: r.link("Vehicle", { storage: "column" }),
    position: r.belongsTo("FitmentPosition", { mappedBy: "fitments", nullable: true }),
    conditionGroups: r.hasMany("FitmentConditionGroup", { mappedBy: "fitment" }),
  }),
  checks: [
    { name: "fitment_from_month_check", expression: "from_month IS NULL OR from_year IS NOT NULL" },
    { name: "fitment_to_month_check", expression: "to_month IS NULL OR to_year IS NOT NULL" },
    {
      name: "fitment_range_check",
      expression:
        "from_year IS NULL OR to_year IS NULL OR to_year * 100 + COALESCE(to_month, 12) >= from_year * 100 + COALESCE(from_month, 1)",
    },
  ],
  messages: {
    unique: [
      {
        on: ["variant_id", "vehicle_id", "position_id"],
        message: "This part is already fitted to this vehicle in this position.",
      },
    ],
  },
  // "Brake pad set (BP-123) → Toyota Corolla 2015–2020 · 1.6 I4 132 hp"
  label: {
    fields: [
      ...ProductVariant.label.fields.map((f) => `variant.${f}`),
      ...Vehicle.label.fields.map((f) => `vehicle.${f}`),
    ],
    format: (f) =>
      [f.variant && ProductVariant.label.format(f.variant), f.vehicle && Vehicle.label.format(f.vehicle)]
        .filter(Boolean)
        .join(" → "),
  },
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

export type AutomotiveAttribute = InferEntity<typeof AutomotiveAttribute>;
export type FitmentPosition = InferEntity<typeof FitmentPosition>;
export type Fitment = InferEntity<typeof Fitment>;
export type FitmentConditionGroup = InferEntity<typeof FitmentConditionGroup>;
export type FitmentCondition = InferEntity<typeof FitmentCondition>;
