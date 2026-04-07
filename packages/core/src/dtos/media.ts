import type * as z from "@medusajs/framework/zod";
import type { UploadedFileSchema, MediaSchema } from "../schemas/media";

export type UploadedFile = z.infer<typeof UploadedFileSchema>;
export type Media = z.infer<typeof MediaSchema>;

export type CreateMediasInput = {
  files: UploadedFile[];
};

export type UpdateMediasInput = {
  updates: { id: string; type: "thumbnail" | "image" }[];
};

export type DeleteMediasInput = {
  ids: string[];
};

// ── Single-record mutation input types (for repository .create() / .update()) ─

export type CreateMediaInput = {
  url: string;
  file_id: string;
  type: "thumbnail" | "image";
  entity_id: string;
};

export type UpdateMediaInput = {
  id: string;
  type?: "thumbnail" | "image";
};
