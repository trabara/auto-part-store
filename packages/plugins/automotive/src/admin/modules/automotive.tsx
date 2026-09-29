import {
  MedusaFieldOverrides,
  EntitySelect,
  defineFeatures,
} from "@repo/medusa-ui";
import { TranslationFunction } from "@repo/medusa-ui/registry";
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
): MedusaFieldOverrides<Vehicle> => ({});

const vehicleCreateFields = (
  t: TranslationFunction,
): MedusaFieldOverrides<CreateVehicleInput> => ({
  model_id: {
    label: "Vehicle Model",
    render: (props: any) => {
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
    render: (props: any) => {
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

export default defineFeatures("Automotive", {
  vehicle: {
    entity: "vehicle",
    path: "/automotive/vehicle",
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
  vehicle_engine: {
    entity: "vehicle",
    path: "/automotive/vehicle-engine",
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
  vehicle_make: {
    entity: "vehicle",
    path: "/automotive/vehicle-make",
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
  vehicle_model: {
    entity: "vehicle",
    path: "/automotive/vehicle-model",
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
});
