import { z } from "@medusajs/framework/zod";
import { CatalogFileSchema, CatalogImportModeSchema, CatalogTaskKindSchema } from "@repo/module-vehicle/contract";

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

// ── Catalog steward (the maintenance workflow) ──

export const AdminStewardRefreshBody = z.object({
  /** Research generations with at most this many configurations (default: none yet). */
  max_configurations: z.number().int().min(0).optional(),
});

export const AdminStewardClaimBody = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  kinds: z.array(CatalogTaskKindSchema).optional(),
  make: z.string().trim().min(1).optional(),
  /** How long the worker holds the tasks (a local model is slow). */
  lease_minutes: z.number().int().min(5).max(1440).default(60),
});

export const AdminStewardLeaseBody = z.object({ lease_token: z.string().min(1) });

export const AdminStewardResultBody = z.object({
  lease_token: z.string().min(1),
  /** The model that answered, e.g. "qwen3.5:4b" (recorded as the source). */
  model: z.string().trim().min(1).optional(),
  /** A local model's answer (object or JSON text), checked against the pages read. */
  output: z.unknown().optional(),
  /** The cloud agent's answer, a catalog file. */
  file: CatalogFileSchema.optional(),
  /** The research agent's answer as it wrote it (JSON text or object; read leniently). */
  answer: z.unknown().optional(),
  notes: z.string().optional(),
  /** The run failed: the task backs off. */
  error: z.string().optional(),
  cost: z.object({ usd: z.number().min(0).optional(), credits: z.number().min(0).optional(), steps: z.number().int().min(0).optional() }).optional(),
  /** Pages the agent read (the gateway records its own reads). */
  sources: z.array(z.string()).optional(),
  /** false: a first attempt (local model); unless it applies, the lease stays for the fallback. */
  final: z.boolean().default(true),
});

export const AdminStewardRejectBody = z.object({ feedback: z.string().trim().max(2000).optional() });

export const AdminResearchSearchBody = z.object({ query: z.string().trim().min(2), task_id: z.string().optional() });
export const AdminResearchWikiSearchBody = AdminResearchSearchBody.extend({ lang: z.string().trim().min(2).max(10).default("en") });
export const AdminResearchReadBody = z.object({
  url: z.string().url(),
  /** What to look for: only the passages about it come back. */
  focus: z.string().trim().optional(),
  task_id: z.string().optional(),
});

/** The research agent's draft: JSON text (the tool's input is a string) or the object itself. */
export const AdminResearchValidateBody = z.object({
  task_id: z.string(),
  answer: z.union([z.string(), z.array(z.unknown()), z.record(z.string(), z.unknown())]).nullish(),
});

export type AdminStewardRefreshBody = z.infer<typeof AdminStewardRefreshBody>;
export type AdminStewardClaimBody = z.infer<typeof AdminStewardClaimBody>;
export type AdminStewardLeaseBody = z.infer<typeof AdminStewardLeaseBody>;
export type AdminStewardResultBody = z.infer<typeof AdminStewardResultBody>;
export type AdminStewardRejectBody = z.infer<typeof AdminStewardRejectBody>;
export type AdminResearchSearchBody = z.infer<typeof AdminResearchSearchBody>;
export type AdminResearchWikiSearchBody = z.infer<typeof AdminResearchWikiSearchBody>;
export type AdminResearchReadBody = z.infer<typeof AdminResearchReadBody>;
export type AdminResearchValidateBody = z.infer<typeof AdminResearchValidateBody>;
