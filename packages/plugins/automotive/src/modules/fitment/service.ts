import { MedusaService } from "@medusajs/framework/utils";
import {
  DataType,
  type Fitment,
  type FitmentCondition,
  type FitmentConditionGroup,
} from "./entities";
import { fitmentModels } from "./models/fitment";

export default class FitmentModuleService extends MedusaService(fitmentModels) {
  /**
   * Fitments whose condition groups all match the given attributes.
   *
   * Load a vehicle's fitments through the module link, e.g.
   * `query.graph({ entity: "vehicle", filters: { id }, fields: ["fitments.*",
   * "fitments.conditionGroups.*", "fitments.conditionGroups.conditions.*",
   * "fitments.conditionGroups.conditions.attribute.*", …] })`.
   */
  filterCompatible<F extends Pick<Fitment, "conditionGroups">>(
    fitments: F[],
    attributes: Record<string, any> = {},
  ): F[] {
    return fitments.filter((fitment) => {
      if (!fitment.conditionGroups?.length) {
        return true;
      }

      return fitment.conditionGroups.every((group) =>
        this.evaluateGroup(group as FitmentConditionGroup, attributes),
      );
    });
  }

  parseValue(
    value: string,
    dataType: DataType,
  ): string | number | boolean | Date {
    switch (dataType) {
      case "number":
        return Number(value);

      case "boolean":
        return value === "true";

      case "date":
        return new Date(value);

      case "string":
      default:
        return value;
    }
  }

  evaluateCondition(
    condition: FitmentCondition,
    attributes: Record<string, any>,
  ): boolean {
    const actual = attributes[condition.attribute.code];

    if (actual === null || actual === undefined) {
      return false;
    }

    const expected = this.parseValue(
      condition.value,
      condition.attribute.dataType,
    );

    switch (condition.operator) {
      case "eq":
        return actual === expected;

      case "neq":
        return actual !== expected;

      case "gt":
        return Number(actual) > Number(expected);

      case "gte":
        return Number(actual) >= Number(expected);

      case "lt":
        return Number(actual) < Number(expected);

      case "lte":
        return Number(actual) <= Number(expected);

      case "between": {
        const upper = this.parseValue(
          condition.valueTo!,
          condition.attribute.dataType,
        );

        return (
          Number(actual) >= Number(expected) && Number(actual) <= Number(upper)
        );
      }

      case "in":
        return condition.value
          .split(",")
          .map((value) =>
            this.parseValue(value.trim(), condition.attribute.dataType),
          )
          .some((value) => value === actual);

      case "not_in":
        return !condition.value
          .split(",")
          .map((value) =>
            this.parseValue(value.trim(), condition.attribute.dataType),
          )
          .some((value) => value === actual);

      default:
        return false;
    }
  }

  evaluateGroup(
    group: FitmentConditionGroup,
    attributes: Record<string, any>,
  ): boolean {
    const results = [
      ...group.conditions.map((condition) =>
        this.evaluateCondition(condition, attributes),
      ),

      ...group.children.map((child) => this.evaluateGroup(child, attributes)),
    ];

    if (results.length === 0) {
      return true;
    }

    return group.operator === "and"
      ? results.every(Boolean)
      : results.some(Boolean);
  }
}
