import { BaseSchema, Model, ModelSchema } from "@repo/core/framework";
import { Vehicle, VehicleSchema } from "./vehicle";
import { z } from "@medusajs/framework/zod";

export enum DataType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  ENUM = "enum",
  ARRAY = "array",
  OBJECT = "object",
}
export type AutomotiveAttribute= Model<{
    code: string
    name: string
    dataType: DataType
    defaultUnit: string | null
    category: string | null
}>;

export const AutomotiveAttributeSchema: ModelSchema<AutomotiveAttribute> = BaseSchema.extend({
    code: z.string().describe("The code of the automotive attribute, e.g., 'engine_size', 'fuel_type', etc."),
    name: z.string().describe("The name of the automotive attribute, e.g., 'Engine Size', 'Fuel Type', etc."),
    dataType: z.enum(DataType).describe("The data type of the automotive attribute, e.g., 'string', 'number', etc."),
    defaultUnit: z.string().nullable().describe("The default unit of the automotive attribute, e.g., 'inches', 'cm', etc."),
    category: z.string().nullable().describe("The category of the automotive attribute, e.g., 'Engine', 'Transmission', etc."),
});

export type FitmentPosition = Model<{
  code: string;
  name: string;
  category: string | null;
  fitments: Fitment[];
}>;

export const FitmentPositionSchema: ModelSchema<FitmentPosition> = BaseSchema.extend({
  code: z.string().describe("The code of the fitment position, e.g., 'FRONT_LEFT', 'REAR_RIGHT', etc."),
  name: z.string().describe("The name of the fitment position, e.g., 'Front Left', 'Rear Right', etc."),
  category: z.string().nullable().describe("The category of the fitment position, e.g., 'Front', 'Rear', etc."),
  fitments: z.array(z.lazy(() => FitmentSchema)).describe("The fitments associated with the fitment position"),
});

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

export type FitmentCondition = Model<{
  group: FitmentConditionGroup;
  attribute: AutomotiveAttribute;
  operator: FitmentConditionOperator;
  value: string;
  valueTo: string | null;
  unit: string | null;
}>;

export const FitmentConditionSchema: ModelSchema<FitmentCondition> = BaseSchema.extend({
  group: z.lazy(() => FitmentConditionGroupSchema).describe("The condition group associated with the fitment condition"),
  attribute: z.lazy(() => AutomotiveAttributeSchema).describe("The attribute of the fitment condition"),
  operator: z.enum(FitmentConditionOperator).describe("The operator of the fitment condition"),
  value: z.string().describe("The value of the fitment condition"),
  valueTo: z.string().nullable().describe("The second value of the fitment condition, used for range comparisons"),
  unit: z.string().nullable().describe("The unit of the fitment condition, e.g., 'inches', 'cm', etc."),
});

enum FitmentConditionGroupOperator {
  AND = "and",
  OR = "or",
}

export type FitmentConditionGroup = Model<{
  operator: FitmentConditionGroupOperator;
  fitment: Fitment;
  conditions: FitmentCondition[];
  children: FitmentConditionGroup[];
  parent: FitmentConditionGroup | null;
}>;


export const FitmentConditionGroupSchema: ModelSchema<FitmentConditionGroup> = BaseSchema.extend({
  operator: z.enum(FitmentConditionGroupOperator).describe("The operator of the condition group"),
  fitment: z.lazy(() => FitmentSchema).describe("The fitment associated with the condition group"),
  conditions: z.array(z.lazy(() => FitmentConditionSchema)).describe("The conditions associated with the condition group"),
  children: z.array(z.lazy(() => FitmentConditionGroupSchema)).describe("The child groups associated with the condition group"),
  parent: z.lazy(() => FitmentConditionGroupSchema).nullable().describe("The parent group associated with the condition group"),
});

export type Fitment = Model<{
  vehicle: Vehicle;
  position: FitmentPosition;
  conditionGroups: FitmentConditionGroup[];
  notes: string | null;
}>;

export const FitmentSchema: ModelSchema<Fitment> = BaseSchema.extend({
    vehicle: z.lazy(() => VehicleSchema).describe("The vehicle associated with the fitment"),
    position: z.lazy(() => FitmentPositionSchema).describe("The position of the fitment"),
    conditionGroups: z.array(z.lazy(() => FitmentConditionGroupSchema)).describe("The condition groups associated with the fitment"),
    notes: z.string().nullable().describe("Additional notes about the fitment"),
});
