import { defineModule } from "@repo/dashboard/module";

import {
  FitmentPositionSchema,
  FitmentSchema,
} from "../../modules/automotive/schemas/fitment";
import {
  CreateFitmentPosition,
  FitmentPositionList,
  UpdateFitmentPosition,
} from "../../modules/automotive/dtos/fitment";
import {
  VehicleEngineSchema,
  VehicleMakeSchema,
  VehicleModelSchema,
  VehicleSchema,
} from "../../modules/automotive/schemas/vehicle";

import {
  CreateEngineInputSchema,
  CreateMakeInputSchema,
  CreateModelInputSchema,
  CreateVehicleInputSchema,
  UpdateEngineInputSchema,
  UpdateMakeInputSchema,
  UpdateModelInputSchema,
  UpdateVehicleInputSchema,
} from "../../modules/automotive/dtos/vehicle";
import { createDto, updateDto } from "../../modules/automotive/schemas/base";

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
        },
        details: { schema: VehicleSchema, getTitle: () => "" },
        create: {
          getTitle: () => "",
          schema: CreateVehicleInputSchema,
        },
        update: {
          getTitle: () => "",
          schema: UpdateVehicleInputSchema,
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
        },
        details: {
          getTitle: () => "",
          schema: VehicleEngineSchema,
        },
        create: {
          getTitle: () => "",
          schema: CreateEngineInputSchema,
        },
        update: {
          getTitle: () => "",
          schema: UpdateEngineInputSchema,
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
        },
        details: { getTitle: () => "", schema: VehicleMakeSchema },
        create: {
          getTitle: () => "",
          schema: CreateMakeInputSchema,
        },
        update: {
          getTitle: () => "",
          schema: UpdateMakeInputSchema,
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
        },
        details: {
          getTitle: () => "",
          schema: VehicleModelSchema,
        },
        create: {
          getTitle: () => "",
          schema: CreateModelInputSchema,
        },
        update: {
          getTitle: () => "",
          schema: UpdateModelInputSchema,
        },
      },
    },
    fitment: {
      path: "/fitment",
      entity: FitmentSchema,
      pages: {
        list: {
          getTitle: () => "",
          schema: FitmentSchema,
        },
        details: { getTitle: () => "", schema: FitmentSchema },
        create: {
          getTitle: () => "",
          schema: createDto(FitmentSchema),
        },
        update: {
          getTitle: () => "",
          schema: updateDto(FitmentSchema),
        },
      },
    },
    fitment_position: {
      path: "/fitment-position",
      entity: FitmentPositionSchema,
      pages: {
        list: {
          getTitle: () => "",
          schema: FitmentPositionList,
        },
        details: { getTitle: () => "", schema: FitmentPositionSchema },
        create: {
          getTitle: () => "",
          schema: CreateFitmentPosition,
        },
        update: {
          getTitle: () => "",
          schema: UpdateFitmentPosition,
        },
      },
    },
  },
});
