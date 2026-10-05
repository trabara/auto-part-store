import { z } from "@medusajs/framework/zod";
import { BASE_MASK } from "../schemas/base";
import { FitmentPositionSchema, FitmentSchema } from "../schemas/fitment";
import { batchUpdateOf } from "./vehicle";

export const FitmentPositionList = FitmentPositionSchema.omit({
  fitments: true,
});
export const CreateFitmentPosition = FitmentPositionList.omit(BASE_MASK);
export const UpdateFitmentPosition = CreateFitmentPosition.partial();
export const UpdateFitmentPositionBatch = batchUpdateOf(UpdateFitmentPosition);

export const FitmentList = FitmentSchema.omit({
  vehicle: true,
  position: true,
  conditionGroups: true,
});
export const CreateFitmentInputSchema = FitmentList.omit(BASE_MASK).extend({
  vehicle_id: z.string(),
  position_id: z.string(),
});
export type CreateFitmentInput = z.infer<typeof CreateFitmentInputSchema>;
export const UpdateFitmentInputSchema = CreateFitmentInputSchema.partial();
export type UpdateFitmentInput = z.infer<typeof UpdateFitmentInputSchema>;
export const UpdateFitmentBatchInputSchema = batchUpdateOf(
  UpdateFitmentInputSchema,
);
