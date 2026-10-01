import { InferEntityType } from "@medusajs/framework/types";
import { DmlEntity } from "@medusajs/framework/utils";
import { createModel, InferDmlSchema, ref } from "@repo/orm";
import {
  VehicleEngineSchema,
  VehicleMakeSchema,
  VehicleModelSchema,
  VehicleSchema,
} from "../models/vehicle";

type VehicleRels = {
  model: { kind: "belongsTo"; model: () => VehicleModelEntity };
  engine: { kind: "belongsTo"; model: () => VehicleEngineEntity };
};

export type VehicleEntity = DmlEntity<
  InferDmlSchema<typeof VehicleSchema, Record<string, never>, VehicleRels>,
  string
>;

export const Vehicle: VehicleEntity = createModel("Vehicle", VehicleSchema, {
  relationships: {
    engine: {
      kind: "belongsTo",
      model: ref<VehicleEngineEntity>("VehicleEngine"),
      options: { mappedBy: "vehicles" },
    },
    model: {
      kind: "belongsTo",
      model: ref<VehicleModelEntity>("VehicleModel"),
      options: { mappedBy: "vehicles" },
    },
  },
  indexes: [
    {
      unique: true,
      on: [
        "model_id",
        "engine_id",
        "body_style",
        "doors",
        "drive",
        "transmission",
        "year_start",
        "year_end",
      ],
    },
  ],
  checks: [
    {
      name: "year_range_check",
      expression: "year_end IS NULL OR year_end >= year_start",
    },
  ],
});

export type VehicleMakeEntity = DmlEntity<
  InferDmlSchema<typeof VehicleMakeSchema>,
  string
>;

type VehicleModelRels = {
  make: { kind: "belongsTo"; model: () => VehicleMakeEntity };
  vehicles: { kind: "hasMany"; model: () => VehicleEntity };
};

export type VehicleModelEntity = DmlEntity<
  InferDmlSchema<
    typeof VehicleModelSchema,
    Record<string, never>,
    VehicleModelRels
  >,
  string
>;

export type VehicleModelDml = InferEntityType<VehicleModelEntity>;

export const VehicleModel: VehicleModelEntity = createModel(
  "VehicleModel",
  VehicleModelSchema,
  {
    relationships: {
      make: {
        kind: "belongsTo",
        model: ref<VehicleMakeEntity>("VehicleMake"),
        options: { mappedBy: "models" },
      },
      vehicles: {
        kind: "hasMany",
        model: ref<VehicleEntity>("Vehicle"),
        options: { mappedBy: "model" },
      },
    },
    indexes: [
      {
        name: "vehicle_model_name_unique",
        on: ["name"],
        unique: true,
      },
    ],
  },
);

export const VehicleMake: VehicleMakeEntity = createModel(
  "VehicleMake",
  VehicleMakeSchema,
  {
    relationships: {
      models: {
        kind: "hasMany",
        model: ref<VehicleModelEntity>("VehicleModel"),
        options: { mappedBy: "make" },
      },
    },
    indexes: [
      {
        name: "vehicle_make_name_unique",
        on: ["name"],
        unique: true,
      },
    ],
  },
);

export type VehicleEngineEntity = DmlEntity<
  InferDmlSchema<typeof VehicleEngineSchema>,
  string
>;

export type VehicleEngineDml = InferEntityType<VehicleEngineEntity>;

export const VehicleEngine: VehicleEngineEntity = createModel(
  "VehicleEngine",
  VehicleEngineSchema,
  {
    relationships: {
      vehicles: {
        kind: "hasMany",
        model: ref<VehicleEntity>("Vehicle"),
        options: { mappedBy: "engine" },
      },
    },
    indexes: [
      {
        name: "vehicle_engine_unique",
        on: ["fuel", "type", "size", "power"],
        unique: true,
      },
    ],
  },
);
