// Gives existing catalog records their provenance by importing the committed
// catalog files again with their trust tier (merge: a value is replaced only
// from a higher tier, staff edits never): the Wikipedia draft as DRAFT (its
// article URLs become the generations' sources), the curated Tunisian lineup
// as REFERENCE (and `on_sale_new` for the models automobile.tn lists new),
// car2db as LICENSED. Folders that don't exist are skipped.
//
//   (from apps/backend) npx medusa exec \
//     ../../packages/domains/automotive/.medusa/server/src/scripts/backfill-catalog-provenance.js \
//     ../../packages/domains/automotive/data/vehicle-catalog [dry-run]
import fs from "node:fs";
import path from "node:path";
import type { ExecArgs } from "@medusajs/framework/types";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";
import { CatalogFileSchema, SourceTier, type CatalogFile } from "@repo/module-vehicle/contract";
import { isCatalog, targetsOf } from "./catalog-files";

/** Folder → tier, in import order (lowest first: higher tiers then correct what they know better). */
const FOLDERS: [string, SourceTier][] = [
  ["tunisia-draft", SourceTier.DRAFT],
  ["tunisia", SourceTier.REFERENCE],
  ["tunisia-car2db", SourceTier.LICENSED],
];

export default async function backfillCatalogProvenance({ container, args = [] }: ExecArgs) {
  const logger = container.resolve("logger");
  const dryRun = args.includes("dry-run");
  const root = args.find((a) => a !== "dry-run");
  if (!root) throw new Error("Usage: backfill-catalog-provenance <data/vehicle-catalog folder> [dry-run]");
  const vehicles = container.resolve<VehicleModuleService>(VEHICLE_MODULE);
  const onSale = new Set<string>();

  for (const [folder, tier] of FOLDERS) {
    const dir = path.resolve(root, folder);
    if (!fs.existsSync(dir)) {
      logger.info(`[provenance] ${folder}: not found, skipped`);
      continue;
    }
    const totals = { files: 0, created: 0, updated: 0, touched: 0, differences: 0, problems: 0 };
    for (const { data, error } of targetsOf(dir)) {
      if (error || !isCatalog(data)) continue;
      const parsed = CatalogFileSchema.safeParse(data);
      if (!parsed.success) continue;
      const file: CatalogFile = { ...parsed.data, source: { ...parsed.data.source, tier } };
      if (tier === SourceTier.REFERENCE) {
        for (const make of file.makes) {
          for (const model of make.models) if (model.source?.includes("/neuf/")) onSale.add(`${make.name}|${model.name}`.toLowerCase());
        }
      }
      const report = await vehicles.importCatalog(file, { dryRun, mode: "merge" });
      totals.files++;
      totals.created += report.created.generations + report.created.vehicles + report.created.models;
      totals.updated += report.updated.length;
      totals.touched += report.touched;
      totals.differences += report.differences.length;
      totals.problems += report.problems.length;
    }
    logger.info(
      `[provenance] ${folder} (${tier}): ${totals.files} files, ${dryRun ? "would touch" : "touched"} ${totals.touched}, updated ${totals.updated} values, created ${totals.created}, ${totals.differences} contradictions kept, ${totals.problems} problems`,
    );
  }

  if (onSale.size) {
    const makes = new Map((await vehicles.listVehicleMakes({}, { select: ["id", "name"] })).map((m) => [m.id, m.name]));
    const models = await vehicles.listVehicleModels({}, { select: ["id", "make_id", "name", "on_sale_new"] });
    const changes = models
      .map((m) => ({ id: m.id, on_sale_new: onSale.has(`${makes.get(m.make_id)}|${m.name}`.toLowerCase()), was: m.on_sale_new }))
      .filter((m) => m.on_sale_new !== m.was)
      .map(({ id, on_sale_new }) => ({ id, on_sale_new }));
    if (!dryRun && changes.length) await vehicles.updateVehicleModels(changes);
    logger.info(`[provenance] on sale new: ${onSale.size} models listed, ${changes.length} ${dryRun ? "would change" : "changed"}`);
  }
}
