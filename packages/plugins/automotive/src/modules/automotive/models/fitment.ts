import { createModel, InferDmlSchema, ref } from "@repo/framework/orm";
import {
  AutomotiveAttributeSchema,
  FitmentConditionGroupSchema,
  FitmentConditionSchema,
  FitmentPositionSchema,
  FitmentSchema,
} from "../schemas/fitment";
import { VehicleEntity } from "./vehicle";
import { DmlEntity } from "@medusajs/framework/utils";

type FitmentPositionEntity = DmlEntity<
  InferDmlSchema<typeof FitmentPositionSchema>,
  string
>;

type FitmentConditionEntity = DmlEntity<
  InferDmlSchema<typeof FitmentConditionSchema>,
  string
>;

type FitmentConditionGroupEntity = DmlEntity<
  InferDmlSchema<typeof FitmentConditionGroupSchema>,
  string
>;

type FitmentEntity = DmlEntity<InferDmlSchema<typeof FitmentSchema>, string>;

type AutomotiveAttributeEntity = DmlEntity<
  InferDmlSchema<typeof AutomotiveAttributeSchema>,
  string
>;

export const Fitment = createModel("Fitment", FitmentSchema, {
  relationships: {
    vehicle: {
      kind: "belongsTo",
      model: ref<VehicleEntity>("Vehicle"),
    },
    position: {
      kind: "belongsTo",
      model: ref<FitmentPositionEntity>("FitmentPosition"),
      options: { mappedBy: "fitments" },
    },
    conditionGroups: {
      kind: "hasMany",
      model: ref<FitmentConditionGroupEntity>("FitmentConditionGroup"),
      options: { mappedBy: "fitment" },
    },
  },
});

export const FitmentPosition = createModel(
  "FitmentPosition",
  FitmentPositionSchema,
  {
    relationships: {
      fitments: {
        kind: "hasMany",
        model: ref<FitmentEntity>("Fitment"),
        options: { mappedBy: "position" },
      },
    },
  },
);

export const FitmentConditionGroup = createModel(
  "FitmentConditionGroup",
  FitmentConditionGroupSchema,
  {
    relationships: {
      fitment: {
        kind: "belongsTo",
        model: ref<FitmentEntity>("Fitment"),
        options: { mappedBy: "conditionGroups" },
      },
      conditions: {
        kind: "hasMany",
        model: ref<FitmentConditionEntity>("FitmentCondition"),
        options: { mappedBy: "group" },
      },
      children: {
        kind: "hasMany",
        model: ref<FitmentConditionGroupEntity>("FitmentConditionGroup"),
        options: { mappedBy: "parent" },
      },
      parent: {
        kind: "belongsTo",
        model: ref<FitmentConditionGroupEntity>("FitmentConditionGroup"),
        options: { mappedBy: "children" },
      },
    },
  },
);

export const AutomotiveAttribute = createModel(
  "AutomotiveAttribute",
  AutomotiveAttributeSchema,
);

export const FitmentCondition = createModel(
  "FitmentCondition",
  FitmentConditionSchema,
  {
    relationships: {
      group: {
        kind: "belongsTo",
        model: ref<FitmentConditionGroupEntity>("FitmentConditionGroup"),
        options: { mappedBy: "conditions" },
      },
      attribute: {
        kind: "belongsTo",
        model: ref<AutomotiveAttributeEntity>("AutomotiveAttribute"),
      },
    },
  },
);
