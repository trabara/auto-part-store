import { defineMiddlewares } from "@medusajs/framework";
import {
  validateAndTransformEntityBody,
  validateAndTransformEntityQuery,
} from "@repo/framework/http";
import {
  CreateEngineInputSchema,
  CreateFitmentPosition,
  CreateMakeInputSchema,
  CreateModelInputSchema,
  CreateVehicleInputSchema,
  FitmentPositionList,
  UpdateFitmentPosition,
  UpdateVehicleInputSchema,
} from "~/modules/automotive/dtos";
import {
  FitmentPositionSchema,
  FitmentSchema,
} from "~/modules/automotive/schemas/fitment";
import {
  VehicleEngineSchema,
  VehicleMakeSchema,
  VehicleModelSchema,
  VehicleSchema,
} from "~/modules/automotive/schemas/vehicle";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/automotive/:entity",
      method: "GET",
      middlewares: [
        validateAndTransformEntityQuery(
          {
            vehicle: VehicleSchema,
            vehicle_engine: VehicleEngineSchema.omit({ vehicles: true }),
            vehicle_model: VehicleModelSchema,
            vehicle_make: VehicleMakeSchema,
            fitment: FitmentSchema,
            fitment_position: FitmentPositionList,
          },
          { isList: true },
        ),
      ],
    },
    {
      matcher: "/admin/automotive/:entity/:id",
      method: "GET",
      middlewares: [
        validateAndTransformEntityQuery({
          vehicle: VehicleSchema,
          vehicle_engine: VehicleEngineSchema.omit({ vehicles: true }),
          vehicle_model: VehicleModelSchema,
          vehicle_make: VehicleMakeSchema,
          fitment: FitmentSchema,
          fitment_position: FitmentPositionSchema,
        }),
      ],
    },
    {
      matcher: "/admin/automotive/:entity",
      method: "POST",
      middlewares: [
        validateAndTransformEntityBody({
          vehicle: CreateVehicleInputSchema,
          vehicle_engine: CreateEngineInputSchema,
          vehicle_model: CreateModelInputSchema,
          vehicle_make: CreateMakeInputSchema,
          fitment: FitmentSchema,
          fitment_position: CreateFitmentPosition,
        }),
      ],
    },
    {
      matcher: "/admin/automotive/:entity",
      method: "PUT",
      middlewares: [
        validateAndTransformEntityBody({
          vehicle: UpdateVehicleInputSchema,
          vehicle_engine: UpdateVehicleInputSchema,
          vehicle_model: UpdateVehicleInputSchema,
          vehicle_make: UpdateVehicleInputSchema,
          fitment: FitmentSchema,
          fitment_position: UpdateFitmentPosition,
        }),
      ],
    },

    {
      matcher: "/admin/automotive/:entity/:id",
      method: "PUT",
      middlewares: [
        validateAndTransformEntityBody({
          vehicle: UpdateVehicleInputSchema,
          vehicle_engine: UpdateVehicleInputSchema,
          vehicle_model: UpdateVehicleInputSchema,
          vehicle_make: UpdateVehicleInputSchema,
          fitment: FitmentSchema,
          fitment_position: UpdateFitmentPosition,
        }),
      ],
    },
    {
      matcher: "/admin/automotive/:entity/:id",
      method: "DELETE",
      middlewares: [],
    },
  ],
});
