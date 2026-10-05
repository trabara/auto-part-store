import { defineModule } from "@repo/framework/core";
import {
  CreateEngineInputSchema,
  CreateVehicleInputSchema,
  UpdateEngineInputSchema,
  UpdateVehicleInputSchema,
} from "../../modules/automotive/dtos/vehicle";
import {
  VehicleEngineSchema,
  VehicleSchema,
} from "../../modules/automotive/schemas/vehicle";

export default defineModule({
  name: "Automotive",
  path: "automotive",
  features: (module) => ({
    vehicle: module.feature({
      relations: {
        engine: {
          targetEntity: "vehicle_engine",
          displayField: "id",
        },
      },
      entity: VehicleSchema,
      routes: (vehicle) => [
        vehicle.route({
          path: "vehicles",
          templateId: "list-template",
          dto: VehicleSchema.omit({ model: true, engine: true }),
          children: (vehicle) => [
            vehicle.route({
              path: "create",
              templateId: "create-template",
              dto: CreateVehicleInputSchema,
            }),
          ],
        }),
        vehicle.route({
          path: "vehicle/:id",
          templateId: "detail-template",
          dto: VehicleSchema,
          children: (vehicle) => [
            vehicle.route({
              path: "edit",
              templateId: "edit-template",
              dto: UpdateVehicleInputSchema,
            }),
          ],
        }),
      ],
    }),
    vehicle_engine: module.feature({
      relations: {
        vehicles: {
          targetEntity: "vehicle",
          displayField: "id",
        },
      },
      entity: VehicleEngineSchema,
      routes: (engine) => [
        engine.route({
          path: "engines",
          templateId: "",
          dto: VehicleEngineSchema.omit({ vehicles: true }),
          children: (engine) => [
            engine.route({
              path: "create",
              templateId: "",
              dto: CreateEngineInputSchema,
            }),
          ],
        }),
        engine.route({
          path: "engine/:id",
          dto: VehicleEngineSchema,
          templateId: "",
          children: (engine) => [
            engine.route({
              path: "edit",
              templateId: "",
              dto: UpdateEngineInputSchema,
            }),
          ],
        }),
      ],
    }),
    // vehicle_make: module.feature({
    //   path: "vehicle-make",
    //   entity: VehicleMakeSchema,
    //   routes : ()=> [
    //     {
    //       getDisplayTitle: () => "",
    //       dto: VehicleMakeSchema.omit({ models: true }),
    //     },
    //     { getDisplayTitle: () => "", dto: VehicleMakeSchema },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: CreateMakeInputSchema,
    //     },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: UpdateMakeInputSchema,
    //     },
    //   ],
    // }),
    // vehicle_model: defineFeature({
    //   path: "vehicle-model",
    //   entity: VehicleModelSchema,
    //   relations: {},
    //   routes: [
    //     {
    //       getDisplayTitle: () => "",
    //       dto: VehicleModelSchema.omit({ make: true, vehicles: true }),
    //     },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: VehicleModelSchema,
    //     },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: CreateModelInputSchema,
    //     },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: UpdateModelInputSchema,
    //     },
    //   ],
    // }),
    // fitment: defineFeature({
    //   path: "fitment",
    //   entity: FitmentSchema,
    //   routes: [
    //     {
    //       getDisplayTitle: () => "",
    //       dto: FitmentSchema,
    //     },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: FitmentSchema,
    //     },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: createDto(FitmentSchema),
    //     },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: updateDto(FitmentSchema),
    //     },
    //   ],
    // }),
    // fitment_position: defineFeature({
    //   path: "/fitment-position",
    //   entity: FitmentPositionSchema,
    //   routes: [
    //     defineRoute({
    //       getDisplayTitle: () => "",
    //       dto: FitmentPositionList,
    //     }),
    //     {
    //       getDisplayTitle: () => "",
    //       dto: FitmentPositionSchema,
    //     },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: CreateFitmentPosition,
    //     },
    //     {
    //       getDisplayTitle: () => "",
    //       dto: UpdateFitmentPosition,
    //     },
    //   ],
    // }),
  }),
});
