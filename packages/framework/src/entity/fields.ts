import { z } from "@medusajs/framework/zod"

/**
 * Field types carrying a UI hint, for entity schemas. Storage stays a plain
 * column; the admin renders the hinted widget.
 *
 * @example
 * ```ts
 * schema: z.object({ id: z.string(), name: z.string(), logo: fields.image() })
 * ```
 */
export const fields = {
  /** Image URL (nullable text column), uploaded through Medusa's file module. */
  image: () => z.string().nullable().optional().meta({ ui: "image" }),
}
