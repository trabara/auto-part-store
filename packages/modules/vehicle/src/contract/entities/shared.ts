// Fields and checks shared by the vehicle entities.
import { z } from "@medusajs/framework/zod";

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
