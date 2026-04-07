import { z } from "@medusajs/framework/zod";

export const FileTypeSchema = z.enum(["thumbnail", "image"]);

export const UploadedFileSchema = z.object({
  id: z.string().optional().describe("The unique identifier of the uploaded file"),
  type: FileTypeSchema.describe("The type of the uploaded file"),
  url: z.string().describe("The URL of the uploaded file"),
  file_id: z.string().describe("The file ID of the uploaded file"),
});

export const MediaSchema = UploadedFileSchema.extend({
  entity_id: z.string().describe("The ID of the entity associated with the media"),
});
