import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import {
  CatalogEntityNameSchema,
  CatalogTaskKind,
  CatalogTaskKindSchema,
  CatalogTaskStatus,
  CatalogTaskStatusSchema,
} from "./enums";

const json = z.record(z.string(), z.any());

/**
 * One unit of catalog maintenance: research a gap, verify records against
 * their source, or settle a rule finding. The ledger remembers what was done,
 * what it cost and when to come back (backoff), and holds proposals and
 * findings for review. Unique per (kind, key).
 */
export const CatalogTask = defineEntity("CatalogTask", {
  schema: BaseSchema.extend({
    kind: CatalogTaskKindSchema.default(CatalogTaskKind.RESEARCH_CONFIGURATIONS).describe("What the task does"),
    key: z.string().describe("Natural key, e.g. renault/clio/v (with the rule for findings)"),
    entity: CatalogEntityNameSchema.nullable().describe("The record type a verification or finding is about"),
    record_id: z.string().nullable().describe("The record a verification or finding is about"),
    make: z.string().nullable().describe("Make"),
    model: z.string().nullable().describe("Model"),
    generation: z.string().nullable().describe("Generation"),
    status: CatalogTaskStatusSchema.default(CatalogTaskStatus.PENDING).describe("Where the task stands"),
    priority: z.number().int().default(0).describe("Higher runs first"),
    attempts: z.number().int().default(0).describe("Runs so far"),
    next_run_at: z.date().nullable().default(null).describe("Not run again before"),
    last_run_at: z.date().nullable().default(null).describe("Last run"),
    lease_until: z.date().nullable().default(null).describe("Leased by a worker until"),
    lease_token: z.string().nullable().default(null).describe("The current lease"),
    attention: z.boolean().default(false).describe("Applied, but contradicts existing values: worth a look"),
    rule: z.string().nullable().default(null).describe("The rule behind a finding"),
    finding: json.nullable().default(null).describe("The finding: severity, message, proposed fix"),
    sources: z.array(z.string()).default([]).describe("Pages read for this task"),
    report: json.nullable().default(null).describe("What the last run did"),
    proposal: json.nullable().default(null).describe("Catalog file waiting for review"),
    cost: json.nullable().default(null).describe("Spend so far: usd, search credits, model, steps"),
    feedback: z.string().nullable().default(null).describe("Reviewer notes, given to the next run"),
  }),
  indexes: [
    { name: "catalog_task_unique", on: ["kind", "key"], unique: true },
    { name: "catalog_task_queue", on: ["status", "next_run_at"] },
  ],
  readOnly: ["lease_until", "lease_token", "attempts", "last_run_at", "report", "cost", "sources"],
  label: {
    fields: ["kind", "make", "model", "generation", "rule"],
    format: (t, ctx) =>
      [t.kind ? ctx.value("CatalogTask", "kind", t.kind) : "", [t.make, t.model, t.generation].filter(Boolean).join(" "), t.rule ?? ""]
        .filter(Boolean)
        .join(" · "),
  },
});

export type CatalogTask = InferEntity<typeof CatalogTask>;
