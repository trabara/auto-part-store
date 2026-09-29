import { defineMiddlewares } from "@medusajs/framework";
import {
  validateAndTransformEntityBody,
  validateAndTransformEntityQuery,
} from "@repo/core/framework";
import {
  CreateEngineInputSchema,
  CreateMakeInputSchema,
  CreateModelInputSchema,
  CreateVehicleInputSchema,
  UpdateVehicleInputSchema,
} from "~/modules/fitment/dtos";
import {
  VehicleEngineSchema,
  VehicleMakeSchema,
  VehicleModelSchema,
  VehicleSchema,
} from "~/modules/fitment/schemas/vehicle";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/automotive/:entity",
      method: "GET",
      middlewares: [
        validateAndTransformEntityQuery(
          {
            vehicle: VehicleSchema,
            // @ts-ignore
            vehicle_engine: VehicleEngineSchema.omit({ vehicles: true }),
            vehicle_model: VehicleModelSchema,
            vehicle_make: VehicleMakeSchema,
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
          // @ts-ignore
          vehicle_engine: VehicleEngineSchema.omit({ vehicles: true }),
          vehicle_model: VehicleModelSchema,
          vehicle_make: VehicleMakeSchema,
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
