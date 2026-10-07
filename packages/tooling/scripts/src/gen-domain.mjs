#!/usr/bin/env node
/**
 * Scaffolds a domain (packages/domains/<name>, a Medusa plugin) on the domain
 * layout (./layout.mjs): it mounts reusable modules (their admin API and
 * admin pages) and holds what spans them.
 *
 *   yarn gen:domain <name> --modules a,b
 *   yarn gen:domain billing --modules invoicing
 *
 * contract/ (manifest, merged translations), composition/ (the composition
 * root, called on the server by a workflow hook and in the admin by
 * admin/setup.ts), api/ mounts, admin/ pages, tests and the layer projects.
 * Apps run it with `composeApplication({ domains: [<name>Domain] })`.
 */
import fs from "node:fs";
import path from "node:path";
import { camel, cli, ENV_TEST, ESLINT_CONFIG, isMain, pascal, referencePackage, repoRoot, writeFiles } from "./gen-common.mjs";
import { domainExports } from "./layout.mjs";

/** What a domain needs to know about a module package: names, key, admin path. */
export function readModule(dir) {
  const src = path.join(repoRoot, "packages/modules", dir, "src");
  if (!fs.existsSync(src)) throw new Error(`unknown module "${dir}" (packages/modules/${dir}).`);
  const read = (f) => fs.readFileSync(path.join(src, f), "utf8");
  const urlPath = read("contract/entities/index.ts").match(/path:\s*["']([^"']+)["']/)?.[1];
  if (!urlPath) throw new Error(`module "${dir}" declares no API path (defineEntities(…, { path })).`);
  const key = read("contract/manifest.ts").match(/key:\s*["']([^"']+)["']/)?.[1];
  return { dir, key, m: camel(dir), pkg: `@repo/module-${dir}`, urlPath };
}

/** Writes the domain package to `outDir` (default packages/domains/<name>); returns its path. */
export function generateDomain({ name, modules: moduleDirs, outDir }) {
  const target = outDir ?? path.join(repoRoot, "packages/domains", name);
  const modules = moduleDirs.map(readModule);
  if (!modules.length) throw new Error("at least one module is required.");
  const Dom = pascal(name);
  const d = camel(name);
  const pkgName = `@repo/domain-${name}`;
  const ref = referencePackage("packages/domains");
  if (!ref) throw new Error("no existing domain to copy package settings from.");

  const files = {
    "package.json": {
      name: pkgName,
      version: "0.0.1",
      private: true,
      description: `${Dom} domain (Medusa plugin) over the ${modules.map((x) => x.dir).join(", ")} modules`,
      license: "UNLICENSED",
      files: [".medusa/server"],
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
    "tsconfig.iso.json": `{
  // Isomorphic layers (contract, core, composition root): no Node, no DOM.
  "extends": ["./tsconfig.json", "@repo/config/ts/layer.json"],
  "compilerOptions": { "rootDir": "./src", "outDir": "./.tsbuild/iso", "types": [], "lib": ["ES2022"] },
  "include": ["src/contract/**/*", "src/core/**/*", "src/composition/**/*"],
  "exclude": ["src/**/__tests__"]
}
`,
    "tsconfig.server.json": `{
  // Medusa plugin folders (HTTP, links, workflows, queries, subscribers,
  // scripts) and tests, on top of the isomorphic layers.
  "extends": ["./tsconfig.json", "@repo/config/ts/layer.json"],
  "compilerOptions": { "rootDir": ".", "outDir": "./.tsbuild/server" },
  "include": [
    "src/api/**/*",
    "src/links/**/*",
    "src/workflows/**/*",
    "src/queries/**/*",
    "src/subscribers/**/*",
    "src/jobs/**/*",
    "src/scripts/**/*",
    "src/**/__tests__/**/*",
    "integration-tests/**/*",
    "medusa-config.ts"
  ],
  "references": [{ "path": "./tsconfig.iso.json" }]
}
`,
    "tsconfig.check.json": `{
  // \`yarn check-types\`: every layer project (see @repo/config/ts/layer.json).
  "files": [],
  "references": [{ "path": "./tsconfig.iso.json" }, { "path": "./tsconfig.server.json" }, { "path": "./src/admin/tsconfig.json" }]
}
`,
    "eslint.config.mjs": ESLINT_CONFIG,
    "jest.config.js": `module.exports = require("@repo/config/jest/medusa.cjs")(__dirname);\n`,
    "vite.config.ts": `export default { plugins: [] };\n`,
    ".gitignore": "/node_modules\n.medusa\n.tsbuild\n.env.test\n",
    ".env.test.example": ENV_TEST,
    "medusa-config.ts": `// Used only by the domain's integration tests (\`medusaIntegrationTestRunner\`
// boots this plugin's \`src\` as a Medusa project). Apps register the domain
// with \`composeApplication\`.
import path from "path";
import { defineConfig, loadEnv } from "@medusajs/framework/utils";
import { ${d}Domain } from "./src/contract";

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
  modules: ${d}Domain.modules.map((m) => ({
    resolve: path.join(__dirname, "../../modules", m.resolve!.replace("@repo/module-", ""), "src", "server"),
  })),
});
`,

    // ── contract ─────────────────────────────────────────────────────────────
    "src/contract/index.ts": `// Contract of the ${name} domain (\`${pkgName}/contract\`): what an
// application needs to run it (see \`composeApplication\`).
export { ${d}Domain } from "./manifest";
`,
    "src/contract/manifest.ts": `// The ${name} domain: what an application registers to run it (this
// plugin plus the modules it builds on). See \`composeApplication\`.
import { defineDomainManifest } from "@repo/framework/core";
${modules.map((x) => `import { ${x.m}Manifest } from "${x.pkg}/contract";`).join("\n")}

export const ${d}Domain = defineDomainManifest({
  name: "${name}",
  resolve: "${pkgName}",
  modules: [${modules.map((x) => `${x.m}Manifest`).join(", ")}],
});
`,
    "src/contract/i18n/index.ts": `// Translations of the ${name} domain: each module's (typed by its English
// messages), plus the domain's. Isomorphic: the admin loads them
// (src/admin/i18n), the server can translate with them (\`translator\`).
import { toAdminI18n } from "@repo/framework/core";
${modules.map((x) => `import { ${x.m}Translations } from "${x.pkg}/contract";`).join("\n")}
import ${d} from "./${name}";

export default toAdminI18n(${[...modules.map((x) => `${x.m}Translations`), d].join(", ")});
`,
    [`src/contract/i18n/${name}.ts`]: `// Translations of the ${name} domain's own admin text (\`modules.${name}.*\`).
import { defineTranslations } from "@repo/framework/core";
import { ar } from "./ar";
import { en } from "./en";
import { fr } from "./fr";

export type ${Dom}Messages = typeof en;

export default defineTranslations("${name}", { en, fr, ar });
`,
    "src/contract/i18n/en.ts": `// English messages of the ${name} domain (widgets, domain pages): the source every locale matches.
export const en = { messages: {} };
`,
    "src/contract/i18n/fr.ts": `import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const fr: SameShape<typeof en> = { messages: {} };
`,
    "src/contract/i18n/ar.ts": `import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const ar: SameShape<typeof en> = { messages: {} };
`,

    // ── composition root ─────────────────────────────────────────────────────
    "src/composition/index.ts": `// Composition root of the ${name} domain: plugs the domain's adapters into
// its modules' ports (e.g. \`provideConditionAttributes\`). Called once per
// runtime: on the server by ../workflows/hooks/composition.ts, in the admin
// by ../admin/setup.ts. Idempotent.
export function compose${Dom}(): void {
  // Nothing to plug in yet.
}
`,
    "src/workflows/hooks/composition.ts": `// Medusa loads workflow hooks at startup: the server side of the domain's
// composition root.
import { compose${Dom} } from "../../composition";

compose${Dom}();
`,

    // ── HTTP adapter ─────────────────────────────────────────────────────────
    "src/api/middlewares.ts": `import { defineMiddlewares } from "@medusajs/framework";
${modules.map((x) => `import { ${x.m}Routes } from "${x.pkg}";`).join("\n")}

export default defineMiddlewares({
  routes: [
    // Each module's generic admin API, at the path its entity set declares.
${modules.map((x) => `    ...${x.m}Routes.middlewares("/admin/${x.urlPath}"),`).join("\n")}
  ],
});
`,

    // ── admin adapter ────────────────────────────────────────────────────────
    "src/admin/tsconfig.json": `{
  // Admin UI (React, DOM), on top of the isomorphic layers.
  "extends": ["@repo/config/ts/admin.json", "@repo/config/ts/layer.json"],
  "compilerOptions": { "rootDir": "..", "outDir": "../../.tsbuild/admin" },
  "include": ["."],
  "references": [{ "path": "../../tsconfig.iso.json" }]
}
`,
    "src/admin/vite-env.d.ts": `/// <reference types="vite/client" />\n`,
    "src/admin/i18n/index.ts": `// Medusa loads the admin translations from here (see ../../contract/i18n).
import resources from "../../contract/i18n";

export default resources;
`,
    "src/admin/setup.ts": `// Admin side of the domain's composition root: import it from pages and
// widgets that use a port the domain provides.
import { compose${Dom} } from "../composition";

compose${Dom}();
`,

    // ── tests ────────────────────────────────────────────────────────────────
    "src/__tests__/manifest.unit.spec.ts": `import { composeApplication } from "@repo/framework/core";
import { ${d}Domain } from "../contract";

describe("${name} domain", () => {
  it("composes into an application with its modules", () => {
    const app = composeApplication({ domains: [${d}Domain] });
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

${Dom} domain: a Medusa plugin over the ${modules.map((x) => `\`${x.pkg}\``).join(", ")} module(s). Layers: contract → core → adapters (see AGENTS.md).

| Folder | Contents |
|---|---|
| \`src/contract\` | manifest (apps: \`composeApplication({ domains: [${d}Domain] })\`), merged translations |
| \`src/core\` | domain rules, pure (add when needed) |
| \`src/composition\` | composition root: the domain's adapters plugged into module ports |
| \`src/api\` | route files mounting each module's admin API, the domain's own routes (handlers only) |
| \`src/workflows\`, \`src/queries\`, \`src/links\`, \`src/subscribers\` | cross-module writes, reads, links, events |
| \`src/admin\` | pages mounting each module's admin definition, widgets |
`,
  };

  for (const x of modules) {
    files[`src/api/admin/${x.urlPath}/[entity]/route.ts`] = `import { ${x.m}Routes } from "${x.pkg}";

export const { GET, POST, PUT } = ${x.m}Routes.collection;
`;
    files[`src/api/admin/${x.urlPath}/[entity]/[id]/route.ts`] = `import { ${x.m}Routes } from "${x.pkg}";

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
  const pkgFile = path.join(target, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
  Object.assign(pkg, domainExports(target));
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");
  return target;
}

if (isMain(import.meta.url)) {
  const { name, flag, fail } = cli("gen:domain", "yarn gen:domain <name> --modules a,b");
  const target = path.join(repoRoot, "packages/domains", name);
  if (fs.existsSync(target)) fail(`${path.relative(repoRoot, target)} already exists.`);
  const moduleDirs = (flag("modules") ?? "").split(",").filter(Boolean);
  if (!moduleDirs.length) fail("--modules is required (at least one module of packages/modules).");
  try {
    generateDomain({ name, modules: moduleDirs });
  } catch (e) {
    fail(e.message);
  }
  const pkgName = `@repo/domain-${name}`;
  console.log(`Created ${path.relative(repoRoot, target)} (${pkgName}) over ${moduleDirs.map((m) => `@repo/module-${m}`).join(", ")}.

Next steps:
  1. yarn install && yarn build
  2. yarn workspace ${pkgName} test:unit && yarn workspace ${pkgName} test:integration:http
  3. Run it in the app (apps/backend):
     - package.json: "${pkgName}": "workspace:*"
     - medusa-config.ts: import { ${camel(name)}Domain } from "${pkgName}/contract";
       composeApplication({ domains: [..., ${camel(name)}Domain] })
  4. yarn workspace backend medusa:db:migrate`);
}
