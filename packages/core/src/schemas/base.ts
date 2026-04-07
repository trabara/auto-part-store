import * as z from "@medusajs/framework/zod";

export const BaseSchema = z.object({
  id: z.string().describe("The unique identifier of the entity"),
  created_at: z.date().describe("The date and time when the entity was created"),
  updated_at: z.date().describe("The date and time when the entity was last updated"),
  deleted_at: z.date().nullable().describe("The date and time when the entity was deleted, if applicable"),
});

type BaseMaskType = {
  created_at: true;
  updated_at: true;
  deleted_at: true;
  id: true;
};

export const BASE_MASK: z.util.Exactly<BaseMaskType, z.infer<typeof BaseSchema>> = {
  created_at: true,
  updated_at: true,
  deleted_at: true,
  id: true,
};
