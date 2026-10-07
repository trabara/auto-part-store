// The generators emit packages that follow their layout (`check-layout`).
//   yarn workspace @repo/scripts test
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { generateDomain } from "../src/gen-domain.mjs";
import { generateModule } from "../src/gen-module.mjs";
import { checkPackage } from "../src/layout.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-layout-"));

test("gen:module follows the module layout", () => {
  const dir = generateModule({ name: "demo-notes", entity: "Note", urlPath: "notes", depends: ["vehicle"], outDir: path.join(tmp, "demo-notes") });
  assert.deepEqual(checkPackage(dir, "module"), []);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  assert.deepEqual(Object.keys(pkg.exports), ["./package.json", ".", "./contract", "./admin"]);
  assert.equal(pkg.dependencies["@repo/module-vehicle"], "workspace:*");
});

test("gen:domain follows the domain layout", () => {
  const dir = generateDomain({ name: "demo", modules: ["vehicle", "parts"], outDir: path.join(tmp, "demo") });
  assert.deepEqual(checkPackage(dir, "domain"), []);
  const manifest = fs.readFileSync(path.join(dir, "src/contract/manifest.ts"), "utf8");
  assert.match(manifest, /modules: \[vehicleManifest, partsManifest\]/);
});

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
