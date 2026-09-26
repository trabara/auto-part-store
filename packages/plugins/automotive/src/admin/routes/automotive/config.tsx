import {
  createEntityConfigs,
  EntitySelect,
  type MedusaFieldOverrides,
} from "@repo/medusa-ui";
import { TranslationFunction } from "@repo/medusa-ui/registry";
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
} from "../../../modules/fitment/dtos/vehicle";
import {
  Vehicle,
  VehicleEngine,
  VehicleEngineSchema,
  VehicleMake,
  VehicleMakeSchema,
  VehicleModelSchema,
  VehicleSchema,
} from "../../../modules/fitment/schemas/vehicle";
import { z } from "@medusajs/framework/zod";

const vehicleFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<Vehicle> => ({});

const vehicleCreateFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<CreateVehicleInput> => ({
  model_id: {
    label: "Vehicle Model",
    render(props) {
      return (
        <EntitySelect
          path="/admin/automotive"
          fields={["id", "name"]}
          //@ts-ignore
          mapper={({ id, name }) => ({ label: name, value: id })}
          entity="vehicle_model"
          {...props}
        />
      );
    },
  },
  engine_id: {
    label: "Vehicle Engine",
    render(props) {
      return (
        <EntitySelect
          path="/admin/automotive"
          fields={["id", "name"]}
          //@ts-ignore
          mapper={({ id, name }) => ({ label: name, value: id })}
          entity="vehicle_engine"
          {...props}
        />
      );
    },
  },
});

const vehicleUpdateFields = (t: TranslationFunction) => ({});

const vehicleEngineListFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<VehicleEngine> => {
  return {};
};

const vehicleEngineCreateFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<CreateEngineInput> => ({});

const vehicleEngineUpdateFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<UpdateEngineInput> => ({});

const vehicleMakeFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<VehicleMake> => ({});

const vehicleMakeCreateFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<CreateMakeInput> => ({});

const vehicleMakeUpdateFields = (t: TranslationFunction) => ({});

const vehicleModelFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<VehicleMake> => ({});

const vehicleModelCreateFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<CreateModelInput> => ({
  make_id: {
    render(props) {
      return (
        <EntitySelect
          path="/admin/automotive"
          fields={["id", "name"]}
          //@ts-ignore
          mapper={({ id, name }) => ({ label: name, value: id })}
          entity="vehicle_make"
          {...props}
        />
      );
    },
  },
});

const vehicleModelUpdateFields = (t: TranslationFunction) => ({});

export const entityConfig = createEntityConfigs("/automotive", {
  vehicle: {
    schema: VehicleSchema,
    list: [VehicleSchema.omit({ model: true, engine: true }), vehicleFields],
    create: [CreateVehicleInputSchema, vehicleCreateFields],
    update: [UpdateVehicleInputSchema, vehicleUpdateFields],
  },
  vehicle_engine: {
    schema: VehicleEngineSchema,
    list: [
      // @ts-ignore
      VehicleEngineSchema.omit({ vehicles: true }),
      vehicleEngineListFields,
    ],
    create: [CreateEngineInputSchema, vehicleEngineCreateFields],
    update: [UpdateEngineInputSchema, vehicleEngineUpdateFields],
  },
  vehicle_make: {
    schema: VehicleMakeSchema,
    // @ts-ignore
    list: [VehicleMakeSchema.omit({ models: true }), vehicleMakeFields],
    create: [CreateMakeInputSchema, vehicleMakeCreateFields],
    update: [UpdateMakeInputSchema, vehicleMakeUpdateFields],
  },
  vehicle_model: {
    schema: VehicleModelSchema,
    list: [
      VehicleModelSchema.omit({ make: true, vehicles: true }),
      vehicleModelFields,
    ],
    create: [CreateModelInputSchema, vehicleModelCreateFields],
    update: [UpdateModelInputSchema, vehicleModelUpdateFields],
  },
});
