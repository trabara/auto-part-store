#!/usr/bin/env node
/**
 * Scaffolds a domain: a Medusa plugin (packages/domains/<name>) that mounts
 * reusable modules (their admin API and admin pages) and holds what spans
 * them (links, workflows, hooks, queries, storefront routes).
 *
 *   yarn gen:domain <name> --modules a,b
 *   yarn gen:domain invoicing --modules invoicing
 *
 * Apps run it with `composeApplication({ domains: [<name>Domain] })`, which
 * registers its modules too.
 */
import fs from "node:fs";
import path from "node:path";
import { camel, cli, ENV_TEST, ESLINT_CONFIG, pascal, referencePackage, repoRoot, writeFiles } from "./gen-common.mjs";

const { name, flag, fail } = cli("gen:domain", "yarn gen:domain <name> --modules a,b");
const target = path.join(repoRoot, "packages/domains", name);
if (fs.existsSync(target)) fail(`${path.relative(repoRoot, target)} already exists.`);

// Modules: package name, export prefix and admin path (read from the module).
const modules = (flag("modules") ?? "").split(",").filter(Boolean).map((dir) => {
  const src = path.join(repoRoot, "packages/modules", dir, "src");
  if (!fs.existsSync(src)) fail(`unknown module "${dir}" (packages/modules/${dir}).`);
  const read = (f) => fs.readFileSync(path.join(src, f), "utf8");
  const urlPath = read("entities/index.ts").match(/path:\s*["']([^"']+)["']/)?.[1];
  if (!urlPath) fail(`module "${dir}" declares no API path (defineEntities(…, { path })).`);
  const key = read("manifest.ts").match(/key:\s*["']([^"']+)["']/)?.[1];
  return { dir, key, m: camel(dir), pkg: `@repo/module-${dir}`, urlPath };
});
if (!modules.length) fail("--modules is required (at least one module of packages/modules).");

const Dom = pascal(name);
const pkgName = `@repo/domain-${name}`;
const ref = referencePackage("packages/domains");
if (!ref) fail("no existing domain to copy package settings from.");

const files = {
  "package.json": {
    name: pkgName,
    version: "0.0.1",
    private: true,
    description: `${Dom} domain (Medusa plugin) over the ${modules.map((x) => x.dir).join(", ")} modules`,
    license: "UNLICENSED",
    files: [".medusa/server"],
    exports: ref.exports,
    scripts: Object.fromEntries(Object.entries(ref.scripts).filter(([k]) => k !== "db:generate")),
    dependencies: {
      "@repo/dashboard": "workspace:*",
      "@repo/framework": "workspace:*",
      ...Object.fromEntries(modules.map((x) => [x.pkg, "workspace:*"])),
    },
    devDependencies: ref.devDependencies,
    peerDependencies: ref.peerDependencies,
    engines: { node: ">=20" },
  },
  "tsconfig.json": `{\n  "extends": "@repo/config/ts/plugin.json"\n}\n`,
  "eslint.config.mjs": ESLINT_CONFIG,
  "jest.config.js": `module.exports = require("@repo/config/jest/medusa.cjs")(__dirname);\n`,
  "vite.config.ts": `export default { plugins: [] };\n`,
  ".gitignore": "/node_modules\n.medusa\n.env.test\n",
  ".env.test.example": ENV_TEST,
  "medusa-config.ts": `// Used only by the domain's integration tests (\`medusaIntegrationTestRunner\`
// boots this plugin's \`src\` as a Medusa project). Apps register the domain
// with \`composeApplication\`.
import path from "path";
import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import { ${camel(name)}Domain } from "./src/manifest";

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
  // The domain's modules, loaded from source (Jest maps @repo/module-* imports
  // to the same files, so the server and the tests share one instance).
  modules: ${camel(name)}Domain.modules.map((m) => ({
    resolve: path.join(__dirname, "../../modules", m.resolve!.replace("@repo/module-", ""), "src"),
  })),
});
`,
  "src/manifest.ts": `// The ${name} domain: what an application registers to run it (this
// plugin plus the modules it builds on). See \`composeApplication\`.
import { defineDomainManifest } from "@repo/framework/core";
${modules.map((x) => `import { ${x.m}Manifest } from "${x.pkg}/manifest";`).join("\n")}

export const ${camel(name)}Domain = defineDomainManifest({
  name: "${name}",
  resolve: "${pkgName}",
  modules: [${modules.map((x) => `${x.m}Manifest`).join(", ")}],
});
`,
  "src/api/middlewares.ts": `import { defineMiddlewares } from "@medusajs/framework";
${modules.map((x) => `import { ${x.m}Routes } from "${x.pkg}/http";`).join("\n")}

export default defineMiddlewares({
  routes: [
    // Each module's generic admin API, at the path its entity set declares.
${modules.map((x) => `    ...${x.m}Routes.middlewares("/admin/${x.urlPath}"),`).join("\n")}
  ],
});
`,
  "src/admin/tsconfig.json": `{\n  "extends": "@repo/config/ts/admin.json",\n  "include": ["."]\n}\n`,
  "src/admin/vite-env.d.ts": `/// <reference types="vite/client" />\n`,
  "src/admin/i18n/index.ts": `// Admin translations of the ${name} domain: each module ships its own
// (typed by its English messages); Medusa loads the merged resources.
import { toAdminI18n } from "@repo/framework/core";
${modules.map((x) => `import { ${x.m}Translations } from "${x.pkg}/admin";`).join("\n")}

export default toAdminI18n(${modules.map((x) => `${x.m}Translations`).join(", ")});
`,
  "src/__tests__/manifest.unit.spec.ts": `import { composeApplication } from "@repo/framework/core";
import { ${camel(name)}Domain } from "../manifest";

describe("${name} domain", () => {
  it("composes into an application with its modules", () => {
    const app = composeApplication({ domains: [${camel(name)}Domain] });
    expect(app.plugins).toEqual([{ resolve: "${pkgName}", options: {} }]);
    expect(app.moduleKeys).toEqual(expect.arrayContaining([${modules.map((x) => `"${x.key}"`).join(", ")}]));
  });
});
`,
  "integration-tests/http/admin-api.spec.ts": `import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";

jest.setTimeout(60 * 1000);

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: { headers: Record<string, string> };

    beforeEach(async () => {
      headers = await adminHeaders(getContainer());
    });

    const status = (p: Promise<any>) => p.then((r) => r.status).catch((e) => e.response?.status);

    it.each([${modules.map((x) => `"/admin/${x.urlPath}"`).join(", ")}])("mounts %s, 404 for unexposed entities", async (base) => {
      expect(await status(api.get(\`\${base}/nope\`, headers))).toBe(404);
    });
  },
});
`,
  "README.md": `# ${pkgName}

${Dom} domain: a Medusa plugin over the ${modules.map((x) => `\`${x.pkg}\``).join(", ")} module(s).

- \`src/manifest.ts\`: the modules it needs (apps: \`composeApplication({ domains: [${camel(name)}Domain] })\`)
- \`src/api\`: route files mounting each module's admin API, plus the domain's own routes
- \`src/admin\`: pages mounting each module's admin definition, widgets, translations
- Cross-module logic: \`src/links\`, \`src/workflows\` (hooks in \`src/workflows/hooks\`), \`src/queries\`, \`src/subscribers\`
`,
};

for (const x of modules) {
  files[`src/api/admin/${x.urlPath}/[entity]/route.ts`] = `import { ${x.m}Routes } from "${x.pkg}/http";

export const { GET, POST, PUT } = ${x.m}Routes.collection;
`;
  files[`src/api/admin/${x.urlPath}/[entity]/[id]/route.ts`] = `import { ${x.m}Routes } from "${x.pkg}/http";

export const { GET, PUT, DELETE } = ${x.m}Routes.item;
`;
  files[`src/admin/routes/${x.urlPath}/page.tsx`] = `import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ModuleHome } from "@repo/framework/admin";
import { i18nKeys } from "@repo/framework/core";
import { ${x.m}Admin as definition } from "${x.pkg}/admin";

// Label: a translation key (module messages); Medusa reads \`translationNs\` statically.
export const config = defineRouteConfig({ label: i18nKeys.module(definition.path), translationNs: "translation" });
export default function ${pascal(x.dir)}Index() {
  return <ModuleHome module={definition} />;
}
`;
  files[`src/admin/routes/${x.urlPath}/[*]/page.tsx`] = `// Every /${x.urlPath}/* URL: the module's routes rendered by the CRUD templates,
// with one sidebar entry per feature.
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Module, crudTemplates } from "@repo/dashboard/module";
import { translatedMenu } from "@repo/framework/core";
import { ModuleRouter } from "@repo/framework/admin";
import { ${x.m}Admin as definition } from "${x.pkg}/admin";

// Labels are translation keys (module messages); Medusa reads \`label\` and
// \`translationNs\` statically, so they are spelled out here.
const menu = translatedMenu(definition);
export const config = defineRouteConfig({ label: menu.label, translationNs: "translation", items: menu.items });

export default function ${pascal(x.dir)}Routes() {
  return (
    <Module module={definition}>
      <ModuleRouter module={definition} templates={crudTemplates} />
    </Module>
  );
}
`;
}

writeFiles(target, files);

const rel = path.relative(repoRoot, target);
console.log(`Created ${rel} (${pkgName}) over ${modules.map((x) => x.pkg).join(", ")}.

Next steps:
  1. yarn install && yarn build
  2. yarn workspace ${pkgName} test:unit && yarn workspace ${pkgName} test:integration:http
  3. Run it in the app (apps/backend):
     - package.json: "${pkgName}": "workspace:*"
     - medusa-config.ts: import { ${camel(name)}Domain } from "${pkgName}/manifest";
       composeApplication({ domains: [..., ${camel(name)}Domain] })
  4. yarn workspace backend medusa:db:migrate`);
