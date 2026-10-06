#!/usr/bin/env node
/**
 * Scaffolds a reusable module package (packages/modules/<name>).
 *
 *   yarn gen:module <name> [--entity <PascalName>] [--path <url>] [--depends a,b]
 *   yarn gen:module invoicing --entity Invoice --path invoices
 *
 * One entity with its models, service, generic admin API (`http.ts`), admin
 * definition and typed translations (en, fr, ar), a manifest and a unit test.
 * A domain mounts it (`yarn gen:domain`); run `db:generate` for its first
 * migration.
 */
import fs from "node:fs";
import path from "node:path";
import { camel, cli, ENV_TEST, ESLINT_CONFIG, kebab, pascal, referencePackage, repoRoot, snake, words, writeFiles } from "./gen-common.mjs";

const { name, flag, fail } = cli("gen:module", "yarn gen:module <name> [--entity <PascalName>] [--path <url>] [--depends a,b]");
const entity = flag("entity") ?? pascal(name);
if (!/^[A-Z][A-Za-z0-9]*$/.test(entity)) fail("--entity must be PascalCase (e.g. Invoice).");
const urlPath = flag("path") ?? kebab(name);
const depends = (flag("depends") ?? "").split(",").filter(Boolean);
for (const dep of depends) {
  if (!fs.existsSync(path.join(repoRoot, "packages/modules", dep))) fail(`unknown module "${dep}" (--depends).`);
}

const target = path.join(repoRoot, "packages/modules", name);
if (fs.existsSync(target)) fail(`${path.relative(repoRoot, target)} already exists.`);

const key = snake(name); // Medusa module key
const m = camel(name); // export prefix: invoicingRoutes, invoicingAdmin…
const Mod = pascal(name);
const MODULE = `${key.toUpperCase()}_MODULE`;
const pkgName = `@repo/module-${name}`;
const entityKey = snake(entity); // invoice (model name, feature key)
const entityFile = kebab(entity);
const ref = referencePackage("packages/modules");
if (!ref) fail("no existing module to copy package settings from.");

const iso = (p) => ({ types: `./dist/${p}.d.ts`, import: `./src/${p}.ts`, default: `./dist/${p}.js` });
const pkg = {
  name: pkgName,
  version: "0.0.1",
  private: true,
  description: `${words(name)} module`,
  license: "UNLICENSED",
  main: "./dist/index.js",
  types: "./dist/index.d.ts",
  files: ["dist", "src"],
  exports: {
    "./package.json": "./package.json",
    ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
    "./entities": iso("entities/index"),
    "./manifest": iso("manifest"),
    "./http": { types: "./dist/http.d.ts", default: "./dist/http.js" },
    "./admin": iso("admin/index"),
  },
  scripts: ref.scripts,
  dependencies: {
    "@repo/framework": "workspace:*",
    ...Object.fromEntries(depends.map((d) => [`@repo/module-${d}`, "workspace:*"])),
  },
  devDependencies: ref.devDependencies,
  peerDependencies: ref.peerDependencies,
  engines: { node: ">=20" },
};

const messages = (t) => `{
  name: "${t.name}",
  features: { ${entityKey}: "${t.plural}" },
  steps: {},
  entities: {
    ${entity}: {
      name: "${t.entity}",
      plural: "${t.plural}",
      fields: { name: "${t.field}" },
      values: {},
    },
  },
}`;

writeFiles(target, {
  "package.json": pkg,
  "tsconfig.json": `{
  "extends": "@repo/config/ts/module.json",
  // Admin UI is type-checked by src/admin/tsconfig.json (DOM, bundler).
  "exclude": ["node_modules", "dist", "src/admin/tsconfig.json"]
}
`,
  "tsconfig.build.json": `{
  // Build: everything but tests and admin UI. The admin definition and
  // translations are built too (typed entry \`./admin\`, loaded by tests).
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "src/**/__tests__"]
}
`,
  "jest.config.js": `module.exports = require("@repo/config/jest/medusa.cjs")(__dirname);\n`,
  "eslint.config.mjs": ESLINT_CONFIG,
  ".gitignore": "/dist\n/node_modules\n.env.test\n",
  ".env.test.example": ENV_TEST,

  "src/constants.ts": `export const ${MODULE} = "${key}";\n`,
  "src/manifest.ts": `import { defineModuleManifest } from "@repo/framework/core";

// Read by the layer check (packages/config/eslint/module-boundaries.js):
// keep \`key\` and \`dependsOn\` literal. This module may import only its
// dependencies' \`entities\` entry.
export const ${m}Manifest = defineModuleManifest({
  key: "${key}",
  dependsOn: [${depends.map((d) => `"${snake(d)}"`).join(", ")}],
  resolve: "${pkgName}",
});
`,
  "src/index.ts": `import { Module } from "@medusajs/framework/utils";
import { ${MODULE} } from "./constants";
import ${Mod}ModuleService from "./service";

export { ${MODULE} };

export default Module(${MODULE}, {
  service: ${Mod}ModuleService,
});

export { type ${Mod}ModuleService };

export { ${m}Manifest } from "./manifest";
`,
  "src/service.ts": `import { MedusaService } from "@medusajs/framework/utils";
import { ${m}Models } from "./models/${kebab(name)}";

// The module's rules on its own data go here (never another module's).
export default class ${Mod}ModuleService extends MedusaService(${m}Models) {}
`,
  [`src/entities/${entityFile}.ts`]: `import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";

export const ${entity} = defineEntity("${entity}", {
  schema: BaseSchema.extend({
    name: z.string().trim().min(1).describe("Display name"),
  }),
});

export type ${entity} = InferEntity<typeof ${entity}>;
`,
  "src/entities/index.ts": `import { defineEntities } from "@repo/framework/entity";
import { ${MODULE} } from "../constants";
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
  [`src/models/${kebab(name)}.ts`]: `// DML models built from the entity definitions (server only). Medusa
// discovers a module's models from the non-index files of \`models/\`.
import { toModels } from "@repo/framework/entity/server";
import { ${m}Entities } from "../entities";

export const ${m}Models = toModels(${m}Entities);

export const { ${entity} } = ${m}Models;
`,
  "src/http.ts": `// Generic admin API of the ${key} module: \`/admin/${urlPath}/:entity[/:id]\`
// (path declared by its entity set). Entities not listed here are a 404.
import { createEntityRoutes } from "@repo/framework/entity/server";
import { ${entity}, ${m}Entities } from "./entities";

export const ${key.toUpperCase()}_PATH = \`/admin/\${${m}Entities.path}\`;

export const ${m}Routes = createEntityRoutes({ entities: [${entity}] });
`,
  "src/admin/tsconfig.json": `{
  "extends": "@repo/config/ts/admin.json",
  "compilerOptions": { "types": ["vite/client"] },
  "include": ["."]
}
`,
  "src/admin/index.ts": `// Admin entry (\`${pkgName}/admin\`): the module's admin definition and
// its translations. No UI code: tests and the server load it too.
export { default as ${m}Admin } from "./module";
export { default as ${m}Translations, type ${Mod}Messages } from "./i18n";
`,
  "src/admin/module.ts": `import { defineModule } from "@repo/framework/core";
import { ${entity} } from "../entities";

// Admin definition of the ${key} module (\`/app/${urlPath}/...\`). Isomorphic: no UI code.
// Features match the entities of the module's API (../http.ts).
export default defineModule({
  name: "${words(name)}",
  path: "${urlPath}",
  features: (m) => ({
    ${entityKey}: m.crud(${entity}),
  }),
});
`,
  "src/admin/i18n/index.ts": `// Translations of the ${key} module's admin. \`${Mod}Messages\` is the
// interface every locale (and any override) must provide.
import { defineTranslations } from "@repo/framework/core";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type ${Mod}Messages = typeof en;

export default defineTranslations("${urlPath}", { en, fr, ar });
`,
  "src/admin/i18n/en.ts": `// English messages of the ${key} module: the source every locale matches.
export const en = ${messages({ name: words(name), plural: `${words(entity)}s`, entity: words(entity), field: "Name" })};
`,
  "src/admin/i18n/fr.ts": `import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

// TODO: translate.
export const fr: SameShape<typeof en> = ${messages({ name: words(name), plural: `${words(entity)}s`, entity: words(entity), field: "Nom" })};
`,
  "src/admin/i18n/ar.ts": `import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

// TODO: translate.
export const ar: SameShape<typeof en> = ${messages({ name: words(name), plural: `${words(entity)}s`, entity: words(entity), field: "الاسم" })};
`,
  "src/__tests__/entities.unit.spec.ts": `import { ${m}Admin } from "../admin";
import { ${entity}, ${m}Entities } from "../entities";
import { ${m}Routes } from "../http";

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

${words(name)} module: a Medusa module (key \`${key}\`) built on \`@repo/framework\` entities, reusable by any domain.

| Entry | Contents |
|---|---|
| \`${pkgName}\` | the Medusa module (service, models, migrations) |
| \`/entities\` | entity definitions (isomorphic) |
| \`/http\` | generic admin API (\`/admin/${urlPath}/:entity\`), mounted by a domain's route files |
| \`/admin\` | admin definition and typed translations (en, fr, ar) |
| \`/manifest\` | key and dependencies (${depends.length ? depends.join(", ") : "none"}) |

After changing entities: \`yarn workspace ${pkgName} db:generate\`, and commit the migration.
`,
});

const rel = path.relative(repoRoot, target);
console.log(`Created ${rel} (${pkgName}) with entity ${entity}.

Next steps:
  1. yarn install
  2. yarn workspace ${pkgName} db:generate     # first migration (local Postgres, see .env.test.example)
  3. yarn workspace ${pkgName} build && yarn workspace ${pkgName} test:unit
  4. Mount it in a domain: yarn gen:domain <name> --modules ${name}
     (or add its manifest, routes and admin pages to an existing domain)`);
