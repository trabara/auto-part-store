// Fitment enums.
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
