import { z } from "@medusajs/framework/zod";
import { CatalogImportModeSchema } from "@repo/module-vehicle/contract";

const flag = z.enum(["true", "false"]).transform((v) => v === "true");
/** Optional query value; an empty one (`?make=`, as automations send) counts as absent. */
const optional = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

/** Which models to research: least complete first. */
export const AdminCatalogCoverageParams = z.object({
  make: optional(z.string().trim().min(1)),
  /** Only models with at most this many configurations. */
  max_configurations: optional(z.coerce.number().int().min(0)),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/** What to research next: models without generations, then thin generations. */
export const AdminCatalogTasksParams = z.object({
  make: optional(z.string().trim().min(1)),
  /** Generations with at most this many configurations (default: none yet). */
  max_configurations: optional(z.coerce.number().int().min(0)),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

/** One make (optionally one model) as a catalog file. */
export const AdminCatalogExportParams = z.object({
  make: z.string().trim().min(1),
  model: optional(z.string().trim().min(1)),
});

export const AdminCatalogImportParams = z.object({
  dry_run: flag.default(false),
  mode: CatalogImportModeSchema.default("create"),
});

export type AdminCatalogCoverageParams = z.infer<typeof AdminCatalogCoverageParams>;
export type AdminCatalogTasksParams = z.infer<typeof AdminCatalogTasksParams>;
export type AdminCatalogExportParams = z.infer<typeof AdminCatalogExportParams>;
export type AdminCatalogImportParams = z.infer<typeof AdminCatalogImportParams>;
