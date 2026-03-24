import { z } from "@medusajs/framework/zod";

export const UpdateStoreDetailsSchema = z.object({
  logo_url: z.optional(z.string().url().nullable()),
  map_url: z.optional(z.string().url().nullable()),
  address: z.optional(z.string().nullable()),
  contact_emails: z.optional(z.array(z.string().email()).default([])),
  contact_phone_numbers: z.optional(z.array(z.string()).default([])),
  // social_links: z
  //   .object({
  //     facebook: z.string().url().optional(),
  //     twitter: z.string().url().optional(),
  //     instagram: z.string().url().optional(),
  //   })
  //   .default({
  //     facebook: undefined,
  //     twitter: undefined,
  //     instagram: undefined,
  //   })
  //   .optional(),
  logo_file: z.optional(z.instanceof(File).refine(
    (file) => ['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type),
    {
      message: "Invalid file type"
    })
  )
});

export type UpdateStoreDetailsInput = z.infer<typeof UpdateStoreDetailsSchema>;
