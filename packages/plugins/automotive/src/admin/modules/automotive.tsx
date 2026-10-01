import { defineModule, FeatureFieldOverrides } from "@repo/dashboard/module";

import {
  Vehicle,
  VehicleEngine,
  VehicleMake,
  VehicleSchema,
  VehicleEngineSchema,
  VehicleMakeSchema,
  VehicleModelSchema,
} from "../../modules/fitment/schemas/vehicle";

import {
  CreateEngineInput,
  CreateEngineInputSchema,
  CreateMakeInput,
  CreateMakeInputSchema,
  CreateModelInput,
  CreateModelInputSchema,
  CreateVehicleInput,
  CreateVehicleInputSchema,
  UpdateEngineInput,
  UpdateEngineInputSchema,
  UpdateMakeInputSchema,
  UpdateModelInputSchema,
  UpdateVehicleInputSchema,
} from "../../modules/fitment/dtos/vehicle";
const vehicleListFields = (
  t: TranslationFunction,
): FeatureFieldOverrides<Vehicle> => ({});

const vehicleCreateFields = (
  t: TranslationFunction,
): FeatureFieldOverrides<CreateVehicleInput> => ({});

type TranslationFunction = (key: string) => string;

const vehicleUpdateFields = (t: TranslationFunction) => ({});

const vehicleEngineListFields = (
  t: TranslationFunction,
): FeatureFieldOverrides<VehicleEngine> => {
  return {};
};

const vehicleEngineCreateFields = (
  t: TranslationFunction,
): FeatureFieldOverrides<CreateEngineInput> => ({});

const vehicleEngineUpdateFields = (
  t: TranslationFunction,
): FeatureFieldOverrides<UpdateEngineInput> => ({});

const vehicleMakeFields = (
  t: TranslationFunction,
): FeatureFieldOverrides<VehicleMake> => ({});

const vehicleMakeCreateFields = (
  t: TranslationFunction,
): FeatureFieldOverrides<CreateMakeInput> => ({});

const vehicleMakeUpdateFields = (t: TranslationFunction) => ({});

const vehicleModelFields = (
  t: TranslationFunction,
): FeatureFieldOverrides<VehicleMake> => ({});

const vehicleModelCreateFields = (
  t: TranslationFunction,
): FeatureFieldOverrides<CreateModelInput> => ({});

const vehicleModelUpdateFields = (t: TranslationFunction) => ({});

export default defineModule({
  id: "automotive",
  name: "Automotive",
  path: "/automotive",
  features: {
    vehicle: {
      path: "/vehicle",
      entity: VehicleSchema,
      pages: {
        list: {
          getTitle: () => "",
          schema: VehicleSchema.omit({ model: true, engine: true }),
          fields: vehicleListFields,
        },
        details: { schema: VehicleSchema, getTitle: () => "" },
        create: {
          getTitle: () => "",
          schema: CreateVehicleInputSchema,
          fields: vehicleCreateFields,
        },
        update: {
          getTitle: () => "",
          schema: UpdateVehicleInputSchema,
          fields: vehicleUpdateFields,
        },
      },
    },
    vehicle_engine: {
      path: "vehicle-engine",
      entity: VehicleEngineSchema,
      pages: {
        list: {
          getTitle: () => "",
          // @ts-ignore
          schema: VehicleEngineSchema.omit({ vehicles: true }),
          fields: vehicleEngineListFields,
        },
        details: {
          getTitle: () => "",
          schema: VehicleEngineSchema,
        },
        create: {
          getTitle: () => "",
          schema: CreateEngineInputSchema,
          fields: vehicleEngineCreateFields,
        },
        update: {
          getTitle: () => "",
          schema: UpdateEngineInputSchema,
          fields: vehicleEngineUpdateFields,
        },
      },
    },
    vehicle_make: {
      path: "vehicle-make",
      entity: VehicleMakeSchema,
      pages: {
        list: {
          getTitle: () => "",
          // @ts-ignore
          schema: VehicleMakeSchema.omit({ models: true }),
          fields: vehicleMakeFields,
        },
        details: { getTitle: () => "", schema: VehicleMakeSchema },
        create: {
          getTitle: () => "",
          schema: CreateMakeInputSchema,
          fields: vehicleMakeCreateFields,
        },
        update: {
          getTitle: () => "",
          schema: UpdateMakeInputSchema,
          fields: vehicleMakeUpdateFields,
        },
      },
    },
    vehicle_model: {
      path: "vehicle-model",
      entity: VehicleModelSchema,
      pages: {
        list: {
          getTitle: () => "",
          schema: VehicleModelSchema.omit({ make: true, vehicles: true }),
          fields: vehicleModelFields,
        },
        details: {
          getTitle: () => "",
          schema: VehicleModelSchema,
        },
        create: {
          getTitle: () => "",
          schema: CreateModelInputSchema,
          fields: vehicleModelCreateFields,
        },
        update: {
          getTitle: () => "",
          schema: UpdateModelInputSchema,
          fields: vehicleModelUpdateFields,
        },
      },
    },
  },
});
