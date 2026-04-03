import type * as z from "@medusajs/framework/zod";
import type {
  UploadedFileSchema,
  EntityImageSchema,
} from "../schemas/entity-media";

export type UploadedFile = z.infer<typeof UploadedFileSchema>;
export type EntityImage = z.infer<typeof EntityImageSchema>;

export type CreateEntityImagesInput = {
  images: UploadedFile[];
};

export type UpdateEntityImagesInput = {
  updates: { id: string; type: "thumbnail" | "image" }[];
};

export type DeleteEntityImagesInput = {
  ids: string[];
};
