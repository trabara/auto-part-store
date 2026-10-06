import { MedusaService } from "@medusajs/framework/utils";
import { get } from "lodash";
import {
  DataType,
  type Fitment,
  type FitmentCondition,
  type FitmentConditionGroup,
} from "./entities";
import { fitmentModels } from "./models/fitment";

type Scalar = string | number | boolean;

/**
 * `in` / `not_in` values: a JSON array (`["Sport, Line", "Base"]`), or a
 * comma-separated list (legacy, no commas inside values).
 */
function listValues(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String);
  }
  return value.split(",").map((v) => v.trim());
}

export default class FitmentModuleService extends MedusaService(fitmentModels) {
  /**
   * Fitments whose condition groups all match the vehicle.
   *
   * `vehicle` holds the fields conditions test, by path (`drive`,
   * `engine.fuel`, `model.make.name`): load it with
   * `query.graph({ entity: "vehicle", fields: [...VEHICLE_ATTRIBUTE_PATHS] })`.
   * Fitments need `conditionGroups.conditions.attribute` and
   * `conditionGroups.children…` loaded.
   */
  filterCompatible<F extends Pick<Fitment, "conditionGroups">>(
    fitments: F[],
    vehicle: Record<string, any> = {},
  ): F[] {
    return fitments.filter((fitment) =>
      (fitment.conditionGroups ?? []).every((group) =>
        this.evaluateGroup(group as FitmentConditionGroup, vehicle),
      ),
    );
  }

  /** A stored condition value as a comparable scalar (dates as epoch ms). */
  parseValue(value: string, dataType: DataType): Scalar {
    switch (dataType) {
      case "number":
        return Number(value);
      case "boolean":
        return value === "true";
      case "date":
        return new Date(value).getTime();
      default:
        return value;
    }
  }

  /** A vehicle value as a comparable scalar, matching `parseValue`. */
  private normalize(actual: unknown, dataType: DataType): Scalar {
    if (dataType === "date") return new Date(actual as string | number | Date).getTime();
    if (dataType === "number") return Number(actual);
    return actual as Scalar;
  }

  evaluateCondition(condition: FitmentCondition, vehicle: Record<string, any>): boolean {
    const { data_type: dataType, code } = condition.attribute;
    const raw = get(vehicle, code);
    if (raw === null || raw === undefined) return false;

    // Array attributes (e.g. options fitted): eq/neq test membership,
    // in/not_in test overlap.
    const actuals = (Array.isArray(raw) ? raw : [raw]).map((v) => this.normalize(v, dataType));
    const values = () => listValues(condition.value).map((v) => this.parseValue(v, dataType));
    const expected = this.parseValue(condition.value, dataType);
    const some = (test: (a: Scalar) => boolean) => actuals.some(test);

    switch (condition.operator) {
      case "eq":
        return some((a) => a === expected);
      case "neq":
        return !some((a) => a === expected);
      case "gt":
        return some((a) => Number(a) > Number(expected));
      case "gte":
        return some((a) => Number(a) >= Number(expected));
      case "lt":
        return some((a) => Number(a) < Number(expected));
      case "lte":
        return some((a) => Number(a) <= Number(expected));
      case "between": {
        if (condition.value_to == null) return false;
        const upper = this.parseValue(condition.value_to, dataType);
        return some((a) => Number(a) >= Number(expected) && Number(a) <= Number(upper));
      }
      case "in": {
        const list = values();
        return some((a) => list.includes(a));
      }
      case "not_in": {
        const list = values();
        return !some((a) => list.includes(a));
      }
      default:
        return false;
    }
  }

  evaluateGroup(group: FitmentConditionGroup, vehicle: Record<string, any>): boolean {
    const results = [
      ...(group.conditions ?? []).map((condition) => this.evaluateCondition(condition, vehicle)),
      ...(group.children ?? []).map((child) => this.evaluateGroup(child, vehicle)),
    ];
    if (results.length === 0) return true;
    return group.operator === "and" ? results.every(Boolean) : results.some(Boolean);
  }
}
