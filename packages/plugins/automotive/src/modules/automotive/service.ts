import { MedusaService } from "@medusajs/framework/utils";
import * as DML from "./entities";
import {
  DataType,
  FitmentCondition,
  FitmentConditionGroup,
} from "./models/fitment";

export default class AutomotiveModuleService extends MedusaService({
  Vehicle: DML.Vehicle,
  VehicleMake: DML.VehicleMake,
  VehicleModel: DML.VehicleModel,
  VehicleEngine: DML.VehicleEngine,
  Fitment: DML.Fitment,
  FitmentPosition: DML.FitmentPosition,
  FitmentConditionGroup: DML.FitmentConditionGroup,
  FitmentCondition: DML.FitmentCondition,
  AutomotiveAttribute: DML.AutomotiveAttribute,
}) {
  async getCompatibleFitments(
    vehicleId: string,
    attributes: Record<string, any> = {},
  ) {
    const fitments = await this.listFitments(
      {
        vehicle_id: vehicleId,
      },
      {
        relations: [
          "vehicle",
          "position",
          "conditionGroups",
          "conditionGroups.conditions",
          "conditionGroups.conditions.attribute",
        ],
      },
    );

    return fitments.filter((fitment) => {
      if (!fitment.conditionGroups?.length) {
        return true;
      }

      return fitment.conditionGroups.every((group) =>
        this.evaluateGroup(group, attributes),
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
