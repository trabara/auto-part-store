// Fields and checks shared by the vehicle entities.
import { z } from "@medusajs/framework/zod";
import { SourceTier, SourceTierSchema } from "./enums";

/** First production car (1886) up to announced model years. */
export const YearSchema = z
  .number()
  .int()
  .min(1886)
  .max(new Date().getFullYear() + 2);

export const years = (r: { year_start?: number; year_end?: number | null }) =>
  r.year_start ? `${r.year_start}–${r.year_end ?? ""}` : "";

export const YEAR_CHECKS = (table: string) => [
  { name: `${table}_year_range_check`, expression: "year_end IS NULL OR year_end >= year_start" },
  // Static bounds (CHECK can't use now()); the schema enforces the moving max.
  { name: `${table}_year_bounds_check`, expression: "year_start BETWEEN 1886 AND 2100" },
];

export const YEAR_MESSAGES = (table: string) => ({
  [`${table}_year_range_check`]: "The last production year can't be before the first.",
  [`${table}_year_bounds_check`]: "The first production year must be between 1886 and 2100.",
});

/** One source a record's values came from. */
export const SourceRefSchema = z.object({
  name: z.string(),
  url: z.string().nullish(),
  tier: SourceTierSchema,
  /** When the source was read (ISO date). */
  at: z.string(),
});
export type SourceRef = z.infer<typeof SourceRefSchema>;

/**
 * Where a catalog record's values came from: its trust tier, its latest
 * sources (at most 5, newest first) and when a source last confirmed it.
 * Server-managed (`PROVENANCE_FIELDS` are read-only in the API).
 */
export const provenanceFields = {
  source_tier: SourceTierSchema.default(SourceTier.DRAFT).describe("How far the values can be trusted, by where they came from"),
  sources: z.array(SourceRefSchema).default([]).describe("Where the values came from (newest first)"),
  verified_at: z.date().nullable().default(null).describe("When a source last confirmed the record"),
};
export const PROVENANCE_FIELDS = ["source_tier", "sources", "verified_at"] as const;
