// Package layouts of modules and domains (contract → core → adapters): the
// spec `check-layout` verifies and the generators follow. See AGENTS.md.
import fs from "node:fs";
import path from "node:path";

export const MODULE_LAYOUT = {
  /** Top-level folders of src/ and their role. */
  src: { contract: "iso", core: "iso", server: "server", admin: "admin", __tests__: "tests" },
  required: [
    "README.md",
    "tsconfig.json",
    "tsconfig.build.json",
    "tsconfig.iso.json",
    "tsconfig.server.json",
    "tsconfig.check.json",
    "src/contract/index.ts",
    "src/contract/manifest.ts",
    "src/contract/entities/index.ts",
    "src/contract/i18n/index.ts",
    "src/server/index.ts",
    "src/server/service.ts",
    "src/server/models",
  ],
  /** Allowed entries per folder (others are an error). */
  allowed: {
    "src/server": ["index.ts", "service.ts", "models", "migrations", "hooks.ts", "http.ts", "workflows"],
    "src/admin": ["index.ts", "module.ts", "ui", "tsconfig.json"],
  },
};

export const DOMAIN_LAYOUT = {
  src: {
    contract: "iso",
    core: "iso",
    composition: "iso",
    api: "server",
    links: "server",
    workflows: "server",
    queries: "server",
    subscribers: "server",
    jobs: "server",
    scripts: "server",
    admin: "admin",
    __tests__: "tests",
  },
  required: [
    "README.md",
    "medusa-config.ts",
    "tsconfig.json",
    "tsconfig.iso.json",
    "tsconfig.server.json",
    "tsconfig.check.json",
    "src/contract/index.ts",
    "src/contract/manifest.ts",
    "src/contract/i18n/index.ts",
  ],
  allowed: {},
};

const iso = (entry) => ({ types: `./dist/${entry}.d.ts`, import: `./src/${entry}.ts`, default: `./dist/${entry}.js` });

/** The package.json fields a module's layout implies (exports, main, types). */
export function moduleExports(dir) {
  const has = (p) => fs.existsSync(path.join(dir, "src", p));
  const exports = {
    "./package.json": "./package.json",
    ".": { types: "./dist/server/index.d.ts", default: "./dist/server/index.js" },
    "./contract": iso("contract/index"),
  };
  if (has("core/index.ts")) exports["./core"] = iso("core/index");
  if (has("admin/index.ts")) exports["./admin"] = iso("admin/index");
  if (has("admin/ui/index.ts")) exports["./admin/ui"] = { types: "./src/admin/ui/index.ts", default: "./src/admin/ui/index.ts" };
  return { main: "./dist/server/index.js", types: "./dist/server/index.d.ts", exports };
}

/** A domain's exports: Medusa's (package.json, admin) and its contract. */
export function domainExports(dir) {
  const exports = { "./package.json": "./package.json", "./contract": "./.medusa/server/src/contract/index.js" };
  if (fs.existsSync(path.join(dir, "src/admin"))) {
    exports["./admin"] = {
      import: "./.medusa/server/src/admin/index.mjs",
      require: "./.medusa/server/src/admin/index.js",
      default: "./.medusa/server/src/admin/index.js",
    };
  }
  return { exports };
}

const KEBAB = /^(\[[^\]]+\]|[a-z0-9]+(-[a-z0-9]+)*)(\.[a-z0-9]+)*$/;
const IGNORED = new Set(["node_modules", "dist", ".medusa", ".tsbuild", ".turbo", "migrations"]);

function walk(dir, visit, rel = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const p = path.join(rel, entry.name);
    visit(p, entry);
    if (entry.isDirectory()) walk(path.join(dir, entry.name), visit, p);
  }
}

/** Layout problems of a module or domain package (empty when it follows the spec). */
export function checkPackage(dir, kind) {
  const spec = kind === "module" ? MODULE_LAYOUT : DOMAIN_LAYOUT;
  const problems = [];
  const src = path.join(dir, "src");
  const exists = (p) => fs.existsSync(path.join(dir, p));

  for (const entry of fs.readdirSync(src)) {
    if (!(entry in spec.src)) problems.push(`src/${entry}: not part of the ${kind} layout (${Object.keys(spec.src).join(", ")})`);
  }
  for (const p of spec.required) if (!exists(p)) problems.push(`${p}: missing`);
  for (const [folder, allowed] of Object.entries(spec.allowed)) {
    if (!exists(folder)) continue;
    for (const entry of fs.readdirSync(path.join(dir, folder))) {
      if (!allowed.includes(entry)) problems.push(`${folder}/${entry}: not allowed here (${allowed.join(", ")})`);
    }
  }

  walk(src, (p, entry) => {
    const name = entry.name.replace(/\.(tsx?|mjs|cjs|js|json)$/, "");
    if (entry.name === "README.md") problems.push(`src/${p}: no READMEs inside src (document the package in its README.md)`);
    else if (!KEBAB.test(name) && name !== "__tests__") problems.push(`src/${p}: file and folder names are kebab-case`);
  });

  if (kind === "module") {
    // One entity per file (enums.ts and shared.ts hold what entities share).
    const entities = path.join(src, "contract/entities");
    if (fs.existsSync(entities)) {
      for (const f of fs.readdirSync(entities)) {
        if (["index.ts", "enums.ts", "shared.ts"].includes(f)) continue;
        const count = (fs.readFileSync(path.join(entities, f), "utf8").match(/\bdefineEntity\(/g) ?? []).length;
        if (count !== 1) problems.push(`src/contract/entities/${f}: one defineEntity per file (found ${count})`);
      }
    }
    if (exists("src/admin/ui") && !exists("src/admin/tsconfig.json")) problems.push("src/admin/tsconfig.json: missing (admin UI layer project)");
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  const expected = kind === "module" ? moduleExports(dir) : domainExports(dir);
  for (const [field, value] of Object.entries(expected)) {
    if (JSON.stringify(pkg[field]) !== JSON.stringify(value)) problems.push(`package.json ${field}: differs from the layout (run with --fix)`);
  }
  return problems;
}

/** Writes the package.json fields the layout implies. */
export function fixPackage(dir, kind) {
  const file = path.join(dir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  Object.assign(pkg, kind === "module" ? moduleExports(dir) : domainExports(dir));
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
}
