import { z } from "@medusajs/framework/zod";

export const UploadedFileSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["thumbnail", "image"]),
  url: z.string(),
  file_id: z.string(),
});

export const EntityImageSchema = UploadedFileSchema.extend({
  entity_id: z.string(),
});
