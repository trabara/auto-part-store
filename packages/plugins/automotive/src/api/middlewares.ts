import { defineMiddlewares } from "@medusajs/framework";
import {
  validateAndTransformEntityBody,
  validateAndTransformEntityQuery,
} from "@repo/framework/http";
import {
  CreateEngineInputSchema,
  CreateFitmentInputSchema,
  CreateFitmentPosition,
  CreateMakeInputSchema,
  CreateModelInputSchema,
  CreateVehicleInputSchema,
  FitmentPositionList,
  UpdateEngineBatchInputSchema,
  UpdateEngineInputSchema,
  UpdateFitmentBatchInputSchema,
  UpdateFitmentInputSchema,
  UpdateFitmentPosition,
  UpdateFitmentPositionBatch,
  UpdateMakeBatchInputSchema,
  UpdateMakeInputSchema,
  UpdateModelBatchInputSchema,
  UpdateModelInputSchema,
  UpdateVehicleBatchInputSchema,
  UpdateVehicleInputSchema,
} from "~/modules/automotive/dtos";
import { FitmentPositionSchema, FitmentSchema } from "~/modules/automotive/schemas/fitment";
import {
  VehicleEngineSchema,
  VehicleMakeSchema,
  VehicleModelSchema,
  VehicleSchema,
} from "~/modules/automotive/schemas/vehicle";

// Keys must match AUTOMOTIVE_ENTITIES (api/admin/automotive/entities.ts);
// entities missing from a map get a 404 from the validation middleware.

const listQuery = {
  vehicle: VehicleSchema,
  vehicle_engine: VehicleEngineSchema.omit({ vehicles: true }),
  vehicle_model: VehicleModelSchema,
  vehicle_make: VehicleMakeSchema,
  fitment: FitmentSchema,
  fitment_position: FitmentPositionList,
};

const detailQuery = {
  ...listQuery,
  fitment_position: FitmentPositionSchema,
};

const createBody = {
  vehicle: CreateVehicleInputSchema,
  vehicle_engine: CreateEngineInputSchema,
  vehicle_model: CreateModelInputSchema,
  vehicle_make: CreateMakeInputSchema,
  fitment: CreateFitmentInputSchema,
  fitment_position: CreateFitmentPosition,
};

const updateBody = {
  vehicle: UpdateVehicleInputSchema,
  vehicle_engine: UpdateEngineInputSchema,
  vehicle_model: UpdateModelInputSchema,
  vehicle_make: UpdateMakeInputSchema,
  fitment: UpdateFitmentInputSchema,
  fitment_position: UpdateFitmentPosition,
};

const batchUpdateBody = {
  vehicle: UpdateVehicleBatchInputSchema,
  vehicle_engine: UpdateEngineBatchInputSchema,
  vehicle_model: UpdateModelBatchInputSchema,
  vehicle_make: UpdateMakeBatchInputSchema,
  fitment: UpdateFitmentBatchInputSchema,
  fitment_position: UpdateFitmentPositionBatch,
};

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/automotive/:entity",
      method: "GET",
      middlewares: [validateAndTransformEntityQuery(listQuery, { isList: true })],
    },
    {
      matcher: "/admin/automotive/:entity/:id",
      method: "GET",
      middlewares: [validateAndTransformEntityQuery(detailQuery)],
    },
    {
      matcher: "/admin/automotive/:entity",
      method: "POST",
      middlewares: [validateAndTransformEntityBody(createBody)],
    },
    {
      matcher: "/admin/automotive/:entity",
      method: "PUT",
      middlewares: [validateAndTransformEntityBody(batchUpdateBody)],
    },
    {
      matcher: "/admin/automotive/:entity/:id",
      method: "PUT",
      middlewares: [validateAndTransformEntityBody(updateBody)],
    },
  ],
});
