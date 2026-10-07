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
  /**
   * Text in several languages, `{ en: "…", fr: "…" }` (JSON column); the
   * admin shows the user's language (see `localizedText`).
   */
  localized: () => z.record(z.string(), z.string()).nullable().optional().meta({ ui: "localized" }),
  /**
   * High-precision decimal (money, rates): a `numeric` column through Medusa's
   * `model.bigNumber()`, which also stores a `raw_<field>` column. Plain
   * `z.number()` maps to `float`, `z.number().int()` to `number` (integer).
   */
  bigNumber: () => z.number().meta({ dml: "bigNumber" }),
  /**
   * Text translated per locale by Medusa's Translation module
   * (`model.text().translatable()`): the field is registered as translatable.
   * Pass a text schema to refine it, e.g. `fields.translatable(z.string().trim().min(1))`.
   */
  translatable: <S extends z.ZodTypeAny = z.ZodString>(schema?: S): S =>
    (schema ?? z.string()).meta({ translatable: true }) as S,
}
