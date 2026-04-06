import { z } from "@medusajs/framework/zod";
import { UploadedFileSchema } from "../schemas/media";

export const CreateMediasSchema = z.object({
  files: z.array(UploadedFileSchema).min(1, "At least one file is required"),
});

export const UpdateMediasSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["thumbnail", "image"]),
      }),
    )
    .min(1, "At least one update is required"),
});

export const DeleteMediasSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
});
