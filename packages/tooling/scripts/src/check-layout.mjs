#!/usr/bin/env node
/**
 * Checks every module (packages/modules/*) and domain (packages/domains/*)
 * against its layout (./layout.mjs): src folders, required files, names,
 * one entity per file, and the package.json exports the layout implies.
 *
 *   yarn check-layout          # report, exit 1 on problems
 *   yarn check-layout --fix    # also rewrite package.json exports
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkPackage, fixPackage } from "./layout.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const fix = process.argv.includes("--fix");
let failed = 0;

for (const [folder, kind] of [["packages/modules", "module"], ["packages/domains", "domain"]]) {
  const base = path.join(root, folder);
  if (!fs.existsSync(base)) continue;
  for (const name of fs.readdirSync(base)) {
    const dir = path.join(base, name);
    if (!fs.existsSync(path.join(dir, "package.json"))) continue;
    if (fix) fixPackage(dir, kind);
    const problems = checkPackage(dir, kind);
    if (problems.length) {
      failed++;
      console.error(`${folder}/${name} (${kind}):\n  ${problems.join("\n  ")}`);
    }
  }
}
if (failed) process.exit(1);
console.log("check-layout: every module and domain follows its layout.");
