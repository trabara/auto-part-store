#!/usr/bin/env node
/**
 * Scaffolds a reusable module package (packages/modules/<name>) on the module
 * layout (./layout.mjs): contract → core → adapters.
 *
 *   yarn gen:module <name> [--entity <PascalName>] [--path <url>] [--depends a,b]
 *   yarn gen:module invoicing --entity Invoice --path invoices
 *
 * contract/ (manifest, the entity, typed translations en/fr/ar), server/ (the
 * Medusa module: service, models, generic admin API), admin/ (definition), a
 * unit test and the layer projects. Add core/ (pure rules) and admin/ui/
 * (React) when needed. A domain mounts it (`yarn gen:domain`); run
 * `db:generate` for its first migration.
 */
import fs from "node:fs";
import path from "node:path";
import { camel, cli, ENV_TEST, ESLINT_CONFIG, isMain, kebab, pascal, referencePackage, repoRoot, snake, words, writeFiles } from "./gen-common.mjs";
import { moduleExports } from "./layout.mjs";

/** Writes the module package to `outDir` (default packages/modules/<name>); returns its path. */
export function generateModule({ name, entity = pascal(name), urlPath = kebab(name), depends = [], outDir }) {
  const target = outDir ?? path.join(repoRoot, "packages/modules", name);
  const key = snake(name); // Medusa module key
  const m = camel(name); // export prefix: invoicingRoutes, invoicingAdmin…
  const Mod = pascal(name);
  const MODULE = `${key.toUpperCase()}_MODULE`;
  const pkgName = `@repo/module-${name}`;
  const entityKey = snake(entity); // model name, feature key
  const entityFile = kebab(entity);
  const ref = referencePackage("packages/modules");
  if (!ref) throw new Error("no existing module to copy package settings from.");

  const messages = (t) => `{
  name: "${t.name}",
  features: { ${entityKey}: "${t.plural}" },
  steps: {},
  messages: {},
  entities: {
    ${entity}: {
      name: "${t.entity}",
      plural: "${t.plural}",
      fields: { name: "${t.field}" },
      values: {},
    },
  },
}`;
  const labels = { name: words(name), plural: `${words(entity)}s`, entity: words(entity) };

  writeFiles(target, {
    "package.json": {
      name: pkgName,
      version: "0.0.1",
      private: true,
      description: `${words(name)} module`,
      license: "UNLICENSED",
      files: ["dist", "src"],
      scripts: ref.scripts,
      dependencies: {
        "@repo/framework": "workspace:*",
        ...Object.fromEntries(depends.map((d) => [`@repo/module-${d}`, "workspace:*"])),
      },
      devDependencies: ref.devDependencies,
      peerDependencies: ref.peerDependencies,
      engines: { node: ">=20" },
    },
    "tsconfig.json": `{\n  "extends": "@repo/config/ts/module.json"\n}\n`,
    "tsconfig.build.json": `{
  // Build: everything but tests and the admin UI (source only, bundled by the admin).
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "src/admin/ui", "src/**/__tests__"]
}
`,
    "tsconfig.iso.json": `{
  // Isomorphic layers (contract, core, admin definition): no Node, no DOM.
  "extends": ["./tsconfig.json", "@repo/config/ts/layer.json"],
  "compilerOptions": { "rootDir": "./src", "outDir": "./.tsbuild/iso", "types": [], "lib": ["ES2022"] },
  "include": ["src/contract/**/*", "src/core/**/*", "src/admin/*.ts"],
  "exclude": ["src/**/__tests__"]
}
`,
    "tsconfig.server.json": `{
  // Server adapter (Medusa module) and tests, on top of the isomorphic layers.
  "extends": ["./tsconfig.json", "@repo/config/ts/layer.json"],
  "compilerOptions": { "rootDir": "./src", "outDir": "./.tsbuild/server" },
  "include": ["src/server/**/*", "src/__tests__/**/*"],
  "references": [{ "path": "./tsconfig.iso.json" }]
}
`,
    "tsconfig.check.json": `{
  // \`yarn check-types\`: every layer project (see @repo/config/ts/layer.json).
  "files": [],
  "references": [{ "path": "./tsconfig.iso.json" }, { "path": "./tsconfig.server.json" }]
}
`,
    "jest.config.js": `module.exports = require("@repo/config/jest/medusa.cjs")(__dirname);\n`,
    "eslint.config.mjs": ESLINT_CONFIG,
    ".gitignore": "/dist\n/.tsbuild\n/node_modules\n.env.test\n",
    ".env.test.example": ENV_TEST,

    // ── contract (isomorphic, the only entry other modules may import) ──────
    "src/contract/index.ts": `// Contract of the ${key} module (\`${pkgName}/contract\`): what it promises
// to the outside, isomorphic and stable. The only entry other modules may import.
export * from "./manifest";
export * from "./entities";
export { default as ${m}Translations, type ${Mod}Messages } from "./i18n";
`,
    "src/contract/manifest.ts": `import { defineModuleManifest } from "@repo/framework/core";

/** Container key of the ${key} module. */
export const ${MODULE} = "${key}";

// Read by the layer check (packages/config/eslint/module-boundaries.js): keep
// \`key\` and \`dependsOn\` literal. Other modules may import only this module's
// contract (\`${pkgName}/contract\`).
export const ${m}Manifest = defineModuleManifest({
  key: "${key}",
  dependsOn: [${depends.map((d) => `"${snake(d)}"`).join(", ")}],
  resolve: "${pkgName}",
});
`,
    [`src/contract/entities/${entityFile}.ts`]: `import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";

export const ${entity} = defineEntity("${entity}", {
  schema: BaseSchema.extend({
    name: z.string().trim().min(1).describe("Display name"),
  }),
});

export type ${entity} = InferEntity<typeof ${entity}>;
`,
    "src/contract/entities/index.ts": `import { defineEntities } from "@repo/framework/entity";
import { ${MODULE} } from "../manifest";
import { ${entity} } from "./${entityFile}";

export * from "./${entityFile}";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    ${entity}: typeof ${entity};
  }
}

/** ${words(name)} module entities; keys are the MedusaService model names. */
export const ${m}Entities = defineEntities({ ${entity} }, { module: ${MODULE}, path: "${urlPath}" });
`,
    "src/contract/i18n/index.ts": `// Translations of the ${key} module. \`${Mod}Messages\` is the interface every
// locale (and any override) must provide.
import { defineTranslations } from "@repo/framework/core";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type ${Mod}Messages = typeof en;

export default defineTranslations("${urlPath}", { en, fr, ar });
`,
    "src/contract/i18n/en.ts": `// English messages of the ${key} module: the source every locale matches.
export const en = ${messages({ ...labels, field: "Name" })};
`,
    "src/contract/i18n/fr.ts": `import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

// TODO: translate.
export const fr: SameShape<typeof en> = ${messages({ ...labels, field: "Nom" })};
`,
    "src/contract/i18n/ar.ts": `import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

// TODO: translate.
export const ar: SameShape<typeof en> = ${messages({ ...labels, field: "الاسم" })};
`,

    // ── server adapter (the Medusa module) ───────────────────────────────────
    "src/server/index.ts": `import { Module } from "@medusajs/framework/utils";
import { ${MODULE} } from "../contract";
import ${Mod}ModuleService from "./service";

export { ${MODULE} };

export default Module(${MODULE}, {
  service: ${Mod}ModuleService,
});

export { type ${Mod}ModuleService };

export { ${m}Manifest } from "../contract";
export { ${key.toUpperCase()}_PATH, ${m}Routes } from "./http";
`,
    "src/server/service.ts": `import { MedusaService } from "@medusajs/framework/utils";
import { ${m}Models } from "./models/${kebab(name)}";

// Thin: loads, calls core rules, persists. Never resolves another module.
export default class ${Mod}ModuleService extends MedusaService(${m}Models) {}
`,
    [`src/server/models/${kebab(name)}.ts`]: `// DML models built from the entity definitions. Medusa discovers a module's
// models from the non-index files of \`models/\`.
import { toModels } from "@repo/framework/entity/server";
import { ${m}Entities } from "../../contract";

export const ${m}Models = toModels(${m}Entities);

export const { ${entity} } = ${m}Models;
`,
    "src/server/http.ts": `// Generic admin API of the ${key} module: \`/admin/${urlPath}/:entity[/:id]\`
// (path declared by its entity set). Entities not listed here are a 404.
import { createEntityRoutes } from "@repo/framework/entity/server";
import { ${entity}, ${m}Entities } from "../contract";

export const ${key.toUpperCase()}_PATH = \`/admin/\${${m}Entities.path}\`;

export const ${m}Routes = createEntityRoutes({ entities: [${entity}] });
`,

    // ── admin adapter (definition; UI goes in admin/ui/) ─────────────────────
    "src/admin/index.ts": `// Admin entry (\`${pkgName}/admin\`): the module's admin definition. No UI
// code (that goes in ./ui): tests and the server load it too.
export { default as ${m}Admin } from "./module";
`,
    "src/admin/module.ts": `import { defineModule } from "@repo/framework/core";
import { ${entity} } from "../contract";

// Admin definition of the ${key} module (\`/app/${urlPath}/...\`). Isomorphic: no UI code.
// Features match the entities of the module's API (../server/http.ts).
export default defineModule({
  name: "${words(name)}",
  path: "${urlPath}",
  features: (m) => ({
    ${entityKey}: m.crud(${entity}),
  }),
});
`,
    "src/__tests__/entities.unit.spec.ts": `import { ${m}Admin } from "../admin";
import { ${entity}, ${m}Entities } from "../contract";
import { ${m}Routes } from "../server/http";

describe("${key} module", () => {
  it("validates ${entityKey} input", () => {
    expect(${entity}.dto.create.parse({ name: " First " }).name).toBe("First");
    expect(() => ${entity}.dto.create.parse({ name: "" })).toThrow();
  });

  it("serves the same entities in the admin and the API, at /${urlPath}", () => {
    expect(${m}Entities.path).toBe("${urlPath}");
    const features = Object.values(${m}Admin.features).map((f) => f.entity.name).sort();
    expect(features).toEqual(${m}Routes.entities.map((e) => e.name).sort());
  });
});
`,
    "README.md": `# ${pkgName}

${words(name)} module (Medusa key \`${key}\`), reusable by any domain. Layers: contract → core → adapters (see AGENTS.md).

| Entry | Layer | Contents |
|---|---|---|
| \`${pkgName}\` | server | the Medusa module (service, models, migrations), \`${m}Routes\` |
| \`/contract\` | iso | manifest, entities, types, ports, translations: the only entry other modules may import |
| \`/admin\` | iso | admin definition |

Dependencies: ${depends.length ? depends.map((d) => `\`${d}\``).join(", ") : "none"}. After changing entities: \`yarn workspace ${pkgName} db:generate\`, and commit the migration.
`,
  });

  // Exports follow the layout (the same rule \`check-layout\` applies).
  const pkgFile = path.join(target, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
  Object.assign(pkg, moduleExports(target));
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");
  return target;
}

if (isMain(import.meta.url)) {
  const { name, flag, fail } = cli("gen:module", "yarn gen:module <name> [--entity <PascalName>] [--path <url>] [--depends a,b]");
  const entity = flag("entity") ?? pascal(name);
  if (!/^[A-Z][A-Za-z0-9]*$/.test(entity)) fail("--entity must be PascalCase (e.g. Invoice).");
  const depends = (flag("depends") ?? "").split(",").filter(Boolean);
  for (const dep of depends) {
    if (!fs.existsSync(path.join(repoRoot, "packages/modules", dep))) fail(`unknown module "${dep}" (--depends).`);
  }
  const target = path.join(repoRoot, "packages/modules", name);
  if (fs.existsSync(target)) fail(`${path.relative(repoRoot, target)} already exists.`);
  generateModule({ name, entity, urlPath: flag("path") ?? kebab(name), depends });
  const pkgName = `@repo/module-${name}`;
  console.log(`Created ${path.relative(repoRoot, target)} (${pkgName}) with entity ${entity}.

Next steps:
  1. yarn install
  2. yarn workspace ${pkgName} db:generate     # first migration (local Postgres, see .env.test.example)
  3. yarn workspace ${pkgName} build && yarn workspace ${pkgName} test:unit
  4. Mount it in a domain: yarn gen:domain <name> --modules ${name}
     (or add its manifest, routes and admin pages to an existing domain)`);
}
