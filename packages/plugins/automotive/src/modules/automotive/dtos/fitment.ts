import { createDto, updateDto } from "../schemas/base";
import { FitmentPositionSchema } from "../schemas/fitment";

export const FitmentPositionList = FitmentPositionSchema.omit({
  fitments: true,
});
export const CreateFitmentPosition = createDto(
  FitmentPositionSchema.omit({ fitments: true }),
);

export const UpdateFitmentPosition = updateDto(CreateFitmentPosition);
