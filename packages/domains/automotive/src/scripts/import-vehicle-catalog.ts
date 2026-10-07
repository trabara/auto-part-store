// Imports vehicle catalog files (`vehicle-catalog@1`, see
// @repo/module-vehicle/contract) into the vehicle module: missing makes,
// models, generations, engines, configurations and references are created;
// existing records are kept (differences are reported). Each file is one
// transaction; nothing is written for a file with problems.
//
//   (from apps/backend) npx medusa exec \
//     ../../packages/domains/automotive/.medusa/server/src/scripts/import-vehicle-catalog.js \
//     ../../packages/domains/automotive/data/vehicle-catalog/tunisia [dry-run]
//
// Arguments: `fill` or `overwrite` (what happens to existing values the file
// contradicts; default: reported only), catalog files or folders (every *.json
// inside whose `format` is vehicle-catalog@…: a folder's model-map.json or
// report.json is skipped; unreadable files count as failed); `dry-run` (a
// plain word: `medusa exec` refuses unknown --flags) reports without writing.
import path from "node:path";
import type { ExecArgs } from "@medusajs/framework/types";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";
import { CatalogFileSchema, type CatalogImportReport } from "@repo/module-vehicle/contract";
import { isCatalog, targetsOf } from "./catalog-files";

const counts = (c: CatalogImportReport["created"]) =>
  `${c.makes} makes, ${c.models} models, ${c.generations} generations, ${c.engines} engines, ${c.vehicles} configurations, ${c.references} references`;

export default async function importVehicleCatalog({ container, args = [] }: ExecArgs) {
  const logger = container.resolve("logger");
  const dryRun = args.includes("dry-run") || args.includes("--dry-run");
  const mode = args.includes("overwrite") ? "overwrite" : args.includes("fill") ? "fill" : "create";
  const words = new Set(["dry-run", "fill", "overwrite"]);
  const targets = args.filter((a) => !a.startsWith("--") && !words.has(a));
  if (!targets.length) throw new Error("Usage: import-vehicle-catalog <file or folder>... [fill|overwrite] [dry-run]");

  const vehicles = container.resolve<VehicleModuleService>(VEHICLE_MODULE);
  let failed = 0;
  for (const { file, data, error, inFolder } of targets.flatMap((t) => targetsOf(path.resolve(t)))) {
    if (error) {
      failed++;
      logger.error(`[vehicle-catalog] ${file}: ${error}`);
      continue;
    }
    if (inFolder && !isCatalog(data)) {
      logger.info(`[vehicle-catalog] ${path.basename(file)}: skipped (not a catalog file)`);
      continue;
    }
    const parsed = CatalogFileSchema.safeParse(data);
    if (!parsed.success) {
      failed++;
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      logger.error(`[vehicle-catalog] ${file}: not a vehicle-catalog@1 file\n  ${issues.join("\n  ")}`);
      continue;
    }
    const report = await vehicles.importCatalog(parsed.data, { dryRun, mode });
    const name = path.basename(file);
    if (report.problems.length) {
      failed++;
      logger.error(`[vehicle-catalog] ${name}: nothing imported\n  ${report.problems.join("\n  ")}`);
      continue;
    }
    logger.info(`[vehicle-catalog] ${name}: ${dryRun ? "would create" : "created"} ${counts(report.created)}; existing ${counts(report.existing)}`);
    for (const change of report.updated) logger.info(`[vehicle-catalog] ${name}: ${dryRun ? "would update" : "updated"} ${change}`);
    for (const difference of report.differences) logger.warn(`[vehicle-catalog] ${name}: ${difference}`);
    for (const warning of report.warnings) logger.warn(`[vehicle-catalog] ${name}: ${warning}`);
  }
  if (failed) throw new Error(`[vehicle-catalog] ${failed} file(s) not imported (see above).`);
}
