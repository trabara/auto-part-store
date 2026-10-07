// The vehicle catalog file format (`vehicle-catalog@1`): makes › models ›
// generations › configurations, each configuration with its engine, from one
// source. Source-neutral: adapters (TecDoc, a specs database export, a curated
// list) write it; `importCatalog` loads it. Isomorphic.
import { z } from "@medusajs/framework/zod";
import {
  BodyStyle,
  BodyStyleSchema,
  Drive,
  DriveSchema,
  EngineLayoutSchema,
  FuelTypeSchema,
  Transmission,
  TransmissionSchema,
  VehicleCategory,
  VehicleReferenceSource,
} from "./entities/enums";
import { YearSchema } from "./entities/shared";

const name = z.string().trim().min(1);

export const CatalogEngineSchema = z.object({
  code: z.string().trim().nullable().default(null),
  fuel: FuelTypeSchema,
  layout: EngineLayoutSchema.nullable().default(null),
  cylinders: z.number().int().min(1).max(16).nullable().default(null),
  displacement_cc: z.number().int().min(50).max(20000).nullable().default(null),
  power_kw: z.number().int().min(1).max(2000),
  name: z.string().trim().optional(),
});

export const CatalogVehicleSchema = z.object({
  engine: CatalogEngineSchema,
  body_style: BodyStyleSchema.default(BodyStyle.SEDAN),
  doors: z.number().int().min(2).max(6).default(4),
  drive: DriveSchema.default(Drive.FWD),
  transmission: TransmissionSchema.default(Transmission.MANUAL),
  trim: z.string().trim().nullable().default(null),
  year_start: YearSchema,
  year_end: YearSchema.nullable().default(null),
  references: z
    .array(z.object({ source: z.enum(VehicleReferenceSource), external_id: name }))
    .default([]),
});

export const CatalogGenerationSchema = z.object({
  name,
  code: z.string().trim().nullable().default(null),
  year_start: YearSchema,
  year_end: YearSchema.nullable().default(null),
  vehicles: z.array(CatalogVehicleSchema).default([]),
  /** Where this generation's data comes from (page, document), for audits. */
  source: z.string().trim().optional(),
});

export const CatalogModelSchema = z.object({
  name,
  category: z.enum(VehicleCategory).default(VehicleCategory.CAR),
  generations: z.array(CatalogGenerationSchema).default([]),
  /** Where this model's data comes from (page, document), for audits. */
  source: z.string().trim().optional(),
});

export const CatalogMakeSchema = z.object({
  name,
  models: z.array(CatalogModelSchema).default([]),
  source: z.string().trim().optional(),
});

export const CatalogFileSchema = z.object({
  format: z.literal("vehicle-catalog@1"),
  /** Market the file describes (ISO 3166-1 alpha-2), e.g. "TN". */
  market: z.string().trim().length(2).toUpperCase().optional(),
  /** Provenance: who publishes the data, under which licence, when retrieved. */
  source: z.object({
    name,
    url: z.string().trim().optional(),
    license: z.string().trim().optional(),
    retrieved_at: z.string().trim().optional(),
  }),
  makes: z.array(CatalogMakeSchema),
});

export type CatalogEngine = z.infer<typeof CatalogEngineSchema>;
export type CatalogVehicle = z.infer<typeof CatalogVehicleSchema>;
export type CatalogGeneration = z.infer<typeof CatalogGenerationSchema>;
export type CatalogModel = z.infer<typeof CatalogModelSchema>;
export type CatalogMake = z.infer<typeof CatalogMakeSchema>;
export type CatalogFile = z.infer<typeof CatalogFileSchema>;

/**
 * What an import may change in existing records: `create` nothing (contradicting
 * values are reported), `fill` only values the record lacks, `overwrite`
 * every contradicting value (for reviewed files).
 */
export const CatalogImportModeSchema = z.enum(["create", "fill", "overwrite"]);
export type CatalogImportMode = z.infer<typeof CatalogImportModeSchema>;

/** What an import did (or would do, in a dry run). */
export type CatalogImportReport = {
  dryRun: boolean;
  /** Problems found before writing (nothing is written when there are any). */
  problems: string[];
  created: { makes: number; models: number; generations: number; engines: number; vehicles: number; references: number };
  existing: { makes: number; models: number; generations: number; engines: number; vehicles: number; references: number };
  /** What the import may change in existing records (`create`: nothing). */
  mode: CatalogImportMode;
  /** Existing values updated (or that would be), one line per field. */
  updated: string[];
  /** Existing values the catalog contradicts, not written (per the mode). */
  differences: string[];
};
