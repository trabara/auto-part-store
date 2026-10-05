#!/usr/bin/env node
/**
 * Scaffolds a domain plugin on the framework's entity stack.
 *
 *   yarn gen:plugin <name> [--entity <PascalName>]
 *   yarn gen:plugin invoicing --entity Invoice
 *
 * Creates packages/plugins/<name> with one entity, its module and models, the
 * generic admin API, an admin CRUD feature in the sidebar, and unit +
 * integration tests on the shared Jest preset. Versions come from an
 * existing plugin and are kept in line by `yarn constraints`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const pluginsDir = path.join(repoRoot, "packages/plugins");

// ── Arguments ────────────────────────────────────────────────────────────────

function fail(message) {
  console.error(`gen:plugin: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const entityFlag = args.indexOf("--entity");
if (!name) fail("usage: yarn gen:plugin <name> [--entity <PascalName>]");
if (!/^[a-z][a-z0-9-]*$/.test(name)) fail(`"${name}" must be kebab-case (e.g. "invoicing").`);

const pascal = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/-/g, "_").toLowerCase();
const kebab = (s) => snake(s).replace(/_/g, "-");

const entity = entityFlag >= 0 ? args[entityFlag + 1] : pascal(name);
if (!entity || !/^[A-Z][A-Za-z0-9]*$/.test(entity)) fail("--entity must be PascalCase (e.g. Invoice).");

const target = path.join(pluginsDir, name);
if (fs.existsSync(target)) fail(`${path.relative(repoRoot, target)} already exists.`);

const Mod = pascal(name); // Invoicing
const MODULE = `${snake(name).toUpperCase()}_MODULE`; // INVOICING_MODULE
const moduleKey = snake(name); // invoicing (container key and URL segment)
const packageName = `@repo/plugin-${name}`;

// ── Reference plugin (versions, local test env) ──────────────────────────────

const reference = fs
  .readdirSync(pluginsDir)
  .map((dir) => path.join(pluginsDir, dir))
  .find((dir) => fs.existsSync(path.join(dir, "package.json")));
if (!reference) fail("no existing plugin to copy dependency versions from.");
const refPkg = JSON.parse(fs.readFileSync(path.join(reference, "package.json"), "utf8"));
const refEnvTest = path.join(reference, ".env.test.example");

// ── Files ────────────────────────────────────────────────────────────────────

const files = {
  "package.json": JSON.stringify(
    {
      name: packageName,
      version: "0.0.1",
      private: true,
      description: `${Mod} capability for the Medusa ERP`,
      license: "UNLICENSED",
      files: [".medusa/server"],
      exports: {
        "./package.json": "./package.json",
        "./.medusa/server/src/modules/*": "./.medusa/server/src/modules/*/index.js",
        "./modules/*": "./.medusa/server/src/modules/*/index.js",
        "./links/*": "./.medusa/server/src/links/*.js",
        "./*": "./.medusa/server/src/*.js",
        "./admin": {
          import: "./.medusa/server/src/admin/index.mjs",
          require: "./.medusa/server/src/admin/index.js",
          default: "./.medusa/server/src/admin/index.js",
        },
      },
      scripts: {
        build: "medusa plugin:build",
        "check-types": "tsc --noEmit",
        dev: "plugin-dev-watch . ../../../apps/backend",
        lint: "eslint .",
        "db:generate":
          "sh -c 'set -a; . ./.env.test.example; [ -f .env.test ] && . ./.env.test; set +a; medusa plugin:db:generate'",
        "test:unit":
          "TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules jest --silent=false --forceExit --passWithNoTests",
        "test:integration:http":
          "TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules jest --silent=false --runInBand --forceExit",
        "test:integration:modules":
          "TEST_TYPE=integration:modules NODE_OPTIONS=--experimental-vm-modules jest --silent=false --runInBand --forceExit --passWithNoTests",
      },
      dependencies: {
        "@repo/dashboard": "workspace:*",
        "@repo/framework": "workspace:*",
      },
      devDependencies: refPkg.devDependencies,
      peerDependencies: refPkg.peerDependencies,
      engines: { node: ">=20" },
    },
    null,
    2,
  ) + "\n",

  "tsconfig.json": `{
  "extends": "@repo/config/ts/plugin.json",
  "compilerOptions": {
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
`,

  "eslint.config.mjs": `import { config as baseConfig } from "@repo/config/eslint/base.js";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: [".medusa/**", "dist/**", "node_modules/**"],
  },
];
`,

  "jest.config.js": `module.exports = require("@repo/config/jest/medusa.cjs")(__dirname);
`,

  "vite.config.ts": `export default { plugins: [] };
`,

  "medusa-config.ts": `// Used only by the plugin's integration tests (\`medusaIntegrationTestRunner\`
// boots the plugin's own \`src\` as a Medusa project). Apps register the plugin
// through their own medusa-config.
import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "test", process.cwd());

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      jwtSecret: process.env.JWT_SECRET || "test-jwt-secret",
      cookieSecret: process.env.COOKIE_SECRET || "test-cookie-secret",
      storeCors: "",
      adminCors: "",
      authCors: "",
    },
  },
  modules: [{ resolve: "./src/modules/${moduleKey}" }],
});
`,

  // ── Module ───────────────────────────────────────────────────────────────
  [`src/modules/${moduleKey}/index.ts`]: `import { Module } from "@medusajs/framework/utils";
import ${Mod}ModuleService from "./service";

export const ${MODULE} = "${moduleKey}";

export default Module(${MODULE}, {
  service: ${Mod}ModuleService,
});

export { type ${Mod}ModuleService };
`,

  [`src/modules/${moduleKey}/service.ts`]: `import { MedusaService } from "@medusajs/framework/utils";
import { ${moduleKey}Models } from "./models/${kebab(name)}";

export default class ${Mod}ModuleService extends MedusaService(${moduleKey}Models) {}
`,

  [`src/modules/${moduleKey}/entities/${kebab(entity)}.ts`]: `import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";

export const ${entity} = defineEntity("${entity}", {
  schema: BaseSchema.extend({
    name: z.string().describe("Display name"),
  }),
});

export type ${entity} = InferEntity<typeof ${entity}>;
`,

  [`src/modules/${moduleKey}/entities/index.ts`]: `import { defineEntities } from "@repo/framework/entity";
import { ${entity} } from "./${kebab(entity)}";

export * from "./${kebab(entity)}";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    ${entity}: typeof ${entity};
  }
}

/** All ${moduleKey} entities; keys are the MedusaService model names. */
export const ${moduleKey}Entities = defineEntities({
  ${entity},
});
`,

  [`src/modules/${moduleKey}/models/${kebab(name)}.ts`]: `// DML models built from the entity definitions (server only). Medusa
// discovers a module's models (e.g. for migrations) from the non-index files
// of its \`models/\` folder, hence the named exports.
import { toModels } from "@repo/framework/entity/server";
import { ${moduleKey}Entities } from "../entities";

export const ${moduleKey}Models = toModels(${moduleKey}Entities);

export const { ${entity} } = ${moduleKey}Models;
`,

  // ── API ──────────────────────────────────────────────────────────────────
  [`src/api/admin/${moduleKey}/entities.ts`]: `import { createEntityRoutes } from "@repo/framework/entity/server";
import { ${MODULE} } from "../../../modules/${moduleKey}";
import { ${entity} } from "../../../modules/${moduleKey}/entities";

/**
 * Generic CRUD API at \`/admin/${moduleKey}/:entity[/:id]\`. Only the entities
 * listed here are reachable; any other \`:entity\` is a 404.
 */
export const ${moduleKey}Routes = createEntityRoutes({
  module: ${MODULE},
  entities: [${entity}],
});
`,

  [`src/api/admin/${moduleKey}/[entity]/route.ts`]: `import { ${moduleKey}Routes } from "../entities";

export const { GET, POST, PUT } = ${moduleKey}Routes.collection;
`,

  [`src/api/admin/${moduleKey}/[entity]/[id]/route.ts`]: `import { ${moduleKey}Routes } from "../../entities";

export const { GET, PUT, DELETE } = ${moduleKey}Routes.item;
`,

  "src/api/middlewares.ts": `import { defineMiddlewares } from "@medusajs/framework";
import { ${moduleKey}Routes } from "./admin/${moduleKey}/entities";

export default defineMiddlewares({
  routes: [...${moduleKey}Routes.middlewares("/admin/${moduleKey}")],
});
`,

  // ── Admin ────────────────────────────────────────────────────────────────
  "src/admin/tsconfig.json": `{
  "extends": "@repo/config/ts/admin.json",
  "include": ["."]
}
`,

  "src/admin/vite-env.d.ts": `/// <reference types="vite/client" />
`,

  [`src/admin/modules/${kebab(name)}.ts`]: `import { defineModule } from "@repo/framework/core";
import { ${entity} } from "../../modules/${moduleKey}/entities";

// Features must match the entities exposed by the generic API
// (api/admin/${moduleKey}/entities.ts).
export default defineModule({
  name: "${Mod.replace(/([a-z])([A-Z])/g, "$1 $2")}",
  path: "${kebab(name)}",
  features: (m) => ({
    ${snake(entity)}: m.crud(${entity}),
  }),
});
`,

  [`src/admin/routes/${kebab(name)}/page.tsx`]: `import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ModuleHome } from "@repo/framework/admin";
import ${moduleKey}Module from "../../modules/${kebab(name)}";

export const config = defineRouteConfig({ label: ${moduleKey}Module.name });

export default function ${Mod}Index() {
  return <ModuleHome module={${moduleKey}Module} />;
}
`,

  [`src/admin/routes/${kebab(name)}/[*]/page.tsx`]: `// Every /${kebab(name)}/* URL: the module's routes rendered by the CRUD templates.
// \`items\` puts one sidebar entry per feature under the module.
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Module, crudTemplates } from "@repo/dashboard/module";
import { ModuleRouter } from "@repo/framework/admin";
import { sidebarItems } from "@repo/framework/core";
import ${moduleKey}Module from "../../../modules/${kebab(name)}";

export const config = defineRouteConfig({
  label: ${moduleKey}Module.name,
  items: sidebarItems(${moduleKey}Module),
});

export default function ${Mod}Routes() {
  return (
    <Module module={${moduleKey}Module}>
      <ModuleRouter module={${moduleKey}Module} templates={crudTemplates} />
    </Module>
  );
}
`,

  // ── Tests ────────────────────────────────────────────────────────────────
  "src/__tests__/admin-module.unit.spec.ts": `import { findSlotRoute, getRoutePath } from "@repo/framework/core";
import ${moduleKey}Module from "../admin/modules/${kebab(name)}";
import { ${moduleKey}Routes } from "../api/admin/${moduleKey}/entities";

describe("${moduleKey} admin module", () => {
  it("exposes the same entities in the admin and the API", () => {
    const features = Object.values(${moduleKey}Module.features).map((f) => f.entity.name).sort();
    expect(features).toEqual(${moduleKey}Routes.entities.map((e) => e.name).sort());
  });

  it("routes features under /${kebab(name)}", () => {
    for (const feature of Object.values(${moduleKey}Module.features)) {
      expect(getRoutePath(findSlotRoute(feature, "list")!.scope)).toMatch(/^\\/${kebab(name)}\\//);
    }
  });
});
`,

  [`integration-tests/http/${kebab(name)}.spec.ts`]: `import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";

jest.setTimeout(60 * 1000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: { headers: Record<string, string> };

    beforeEach(async () => {
      headers = await adminHeaders(getContainer());
    });

    const status = (p: Promise<any>) =>
      p.then((r) => r.status).catch((e) => e.response?.status);

    it("creates and lists ${entity} records", async () => {
      const created = await api.post("/admin/${moduleKey}/${snake(entity)}", { name: "First" }, headers);
      expect(created.status).toBe(201);

      const list = await api.get("/admin/${moduleKey}/${snake(entity)}?fields=id,name", headers);
      expect(list.data.data).toEqual([{ id: created.data.data.id, name: "First" }]);
    });

    it("404s for entities that are not exposed", async () => {
      expect(await status(api.get("/admin/${moduleKey}/nope", headers))).toBe(404);
    });
  },
});
`,

  "README.md": `# ${packageName}

${Mod} capability for the Medusa ERP, built on \`@repo/framework\` entities.

- Entities: \`src/modules/${moduleKey}/entities\` (add new ones to \`entities/index.ts\` and to the registry there)
- Admin API: \`/admin/${moduleKey}/:entity\` (exposed entities in \`src/api/admin/${moduleKey}/entities.ts\`)
- Admin UI: \`src/admin/modules/${kebab(name)}.ts\` (one \`m.crud(...)\` per feature)

After changing entities, run \`yarn workspace ${packageName} db:generate\` to create a migration.
`,
};

// ── Write ────────────────────────────────────────────────────────────────────

for (const [file, content] of Object.entries(files)) {
  const out = path.join(target, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content);
}
if (fs.existsSync(refEnvTest)) fs.copyFileSync(refEnvTest, path.join(target, ".env.test.example"));

const rel = path.relative(repoRoot, target);
console.log(`Created ${rel} (${packageName}) with entity ${entity}.

Next steps:
  1. yarn install
  2. yarn workspace ${packageName} db:generate     # first migration (${rel}/.env.test.example; override in .env.test)
  3. yarn workspace ${packageName} test:unit && yarn workspace ${packageName} test:integration:http
  4. Enable it in the app: add "${packageName}": "workspace:*" to apps/backend/package.json
     and { resolve: "${packageName}" } to plugins in apps/backend/medusa-config.ts`);
