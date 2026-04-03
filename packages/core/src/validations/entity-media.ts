import { z } from "@medusajs/framework/zod";
import { UploadedFileSchema } from "../schemas/entity-media";

export const CreateEntityImagesSchema = z.object({
  images: z.array(UploadedFileSchema).min(1, "At least one image is required"),
});

export const UpdateEntityImagesSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["thumbnail", "image"]),
      }),
    )
    .min(1, "At least one update is required"),
});

export const DeleteEntityImagesSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
});
