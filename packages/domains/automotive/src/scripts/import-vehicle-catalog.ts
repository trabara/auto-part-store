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
// Arguments: catalog files or folders (every *.json inside whose `format` is
// vehicle-catalog@…, so a folder's model-map.json or report.json is skipped); `dry-run` (a
// plain word: `medusa exec` refuses unknown --flags) reports without writing.
import fs from "node:fs";
import path from "node:path";
import type { ExecArgs } from "@medusajs/framework/types";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";
import { CatalogFileSchema, type CatalogImportReport } from "@repo/module-vehicle/contract";

const catalogFiles = (target: string): string[] => {
  const stat = fs.statSync(target);
  if (!stat.isDirectory()) return [target];
  return fs
    .readdirSync(target)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(target, f))
    .filter((f) => /"format"\s*:\s*"vehicle-catalog@/.test(fs.readFileSync(f, "utf8").slice(0, 200)));
};

const counts = (c: CatalogImportReport["created"]) =>
  `${c.makes} makes, ${c.models} models, ${c.generations} generations, ${c.engines} engines, ${c.vehicles} configurations, ${c.references} references`;

export default async function importVehicleCatalog({ container, args = [] }: ExecArgs) {
  const logger = container.resolve("logger");
  const dryRun = args.includes("dry-run") || args.includes("--dry-run");
  const targets = args.filter((a) => !a.startsWith("--") && a !== "dry-run");
  if (!targets.length) throw new Error("Usage: import-vehicle-catalog <file or folder>... [dry-run]");

  const vehicles = container.resolve<VehicleModuleService>(VEHICLE_MODULE);
  let failed = 0;
  for (const file of targets.flatMap((t) => catalogFiles(path.resolve(t)))) {
    const parsed = CatalogFileSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
    if (!parsed.success) {
      failed++;
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      logger.error(`[vehicle-catalog] ${file}: not a vehicle-catalog@1 file\n  ${issues.join("\n  ")}`);
      continue;
    }
    const report = await vehicles.importCatalog(parsed.data, { dryRun });
    const name = path.basename(file);
    if (report.problems.length) {
      failed++;
      logger.error(`[vehicle-catalog] ${name}: nothing imported\n  ${report.problems.join("\n  ")}`);
      continue;
    }
    logger.info(`[vehicle-catalog] ${name}: ${dryRun ? "would create" : "created"} ${counts(report.created)}; existing ${counts(report.existing)}`);
    for (const difference of report.differences) logger.warn(`[vehicle-catalog] ${name}: ${difference}`);
  }
  if (failed) throw new Error(`[vehicle-catalog] ${failed} file(s) not imported (see above).`);
}
