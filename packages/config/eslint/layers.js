/**
 * Dependency layers of the monorepo, enforced by `yarn check-layers` (CI).
 *
 * Kept separate from the per-workspace lint configs on purpose: those use
 * eslint-plugin-only-warn, which turns every rule into a warning, while a
 * layer violation must fail the build.
 *
 *   apps            → anything
 *   domain server   → framework, modules, Medusa; never another domain or a ui package
 *   domain admin    → isomorphic framework entries, module entries, ui, admin-safe Medusa packages
 *   modules         → framework, Medusa, own files + declared dependencies'
 *                     `entities` entry (manifest.ts); never a domain
 *                     (see module-boundaries.js); admin/ as domain admin
 *   ui packages     → isomorphic framework entries, admin-safe Medusa packages
 *   framework       → Medusa, zod, lodash; never ui, modules or domains
 *
 * Type-only imports are always allowed (they are erased at build time).
 */
import tseslint from "typescript-eslint";
import { moduleBoundaries } from "./module-boundaries.js";

const DOMAINS = {
  group: ["@repo/domain-*", "@repo/domain-*/**", "@repo/plugin-*", "@repo/plugin-*/**"],
  message:
    "Only apps may import domains (plugins). Domains cooperate through Medusa links, workflows and events, or share modules.",
};

const MODULES = {
  group: ["@repo/module-*", "@repo/module-*/**"],
  message: "The platform knows no module: modules build on the framework, not the other way round.",
};

const UI_PACKAGES = {
  group: ["@repo/dashboard", "@repo/dashboard/*"],
  message: "UI packages are admin-only; server code must not import them.",
};

const FRAMEWORK_SERVER_ENTRIES = {
  group: [
    "@repo/framework/entity/server",
    "@repo/framework/http",
    "@repo/framework/orm",
    "@repo/framework/admin/plugins",
  ],
  message:
    "Server-only framework entry. Admin code may use @repo/framework/{core,entity,utils,admin}.",
};

const MEDUSA_SERVER_PACKAGES = {
  group: [
    // The bare "@medusajs/framework" entry is a `paths` rule (see restrict):
    // excluding it here would make the zod exception impossible.
    "@medusajs/framework/*",
    "!@medusajs/framework/zod",
    "@medusajs/medusa",
    "@medusajs/medusa/*",
    "@medusajs/utils",
    "@medusajs/utils/*",
    "@medusajs/workflows-sdk",
    "@medusajs/workflows-sdk/*",
  ],
  message:
    "Server-side Medusa package in admin code. Admin code may use @medusajs/{ui,icons,admin-sdk,js-sdk} and @medusajs/framework/zod (types: import type).",
};

/** Relative paths into a plugin's server-side folders, from its admin code. */
const PLUGIN_SERVER_FOLDERS = {
  group: [
    "**/api/**",
    "**/models/**",
    "**/service",
    "**/workflows/**",
    "**/links/**",
    "**/subscribers/**",
    "**/jobs/**",
  ],
  message:
    "Admin code must not import server code. Entity definitions (`@repo/module-*/entities`) are isomorphic and allowed.",
};

/** Relative paths into the framework's server-only modules, from its isomorphic files. */
const FRAMEWORK_SERVER_MODULES = {
  group: [
    "../http",
    "../http/*",
    "../orm",
    "../orm/*",
    "!../orm/types",
    "!../orm/types/*",
    "./server",
    "./models",
    "./routes",
    "./http",
    "./workflows",
    "./plugins",
    "./plugins/*",
  ],
  message:
    "Isomorphic framework module importing server code. Keep entity/core/utils/admin loadable in the browser (see entity/isomorphic.spec.ts).",
};

const restrict = (...patterns) => ({
  "@typescript-eslint/no-restricted-imports": [
    "error",
    {
      patterns: patterns.map((pattern) => ({ ...pattern, allowTypeImports: true })),
      paths: patterns.includes(MEDUSA_SERVER_PACKAGES)
        ? [{ name: "@medusajs/framework", message: MEDUSA_SERVER_PACKAGES.message, allowTypeImports: true }]
        : [],
    },
  ],
});

export const layers = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.medusa/**",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/__tests__/**",
      "**/integration-tests/**",
      "**/*.config.*",
    ],
  },
  {
    files: ["**/*.{ts,tsx,mts,cts,js,mjs,jsx}"],
    languageOptions: { parser: tseslint.parser },
    plugins: { "@typescript-eslint": tseslint.plugin, layers: { rules: { "module-boundaries": moduleBoundaries } } },
    // Inline eslint-disable comments are ignored: they reference rules this
    // config doesn't load, and a layer rule must not be silenced in place.
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "off" },
  },

  // framework: never UI, modules or domains
  {
    files: ["packages/framework/src/**"],
    rules: restrict(UI_PACKAGES, DOMAINS, MODULES),
  },
  // framework isomorphic entries: additionally no server modules
  {
    files: [
      "packages/framework/src/core/**",
      "packages/framework/src/utils/**",
      "packages/framework/src/admin/*.{ts,tsx}",
      "packages/framework/src/entity/{index,define-entity,define-entities,relations,types}.ts",
      "packages/framework/src/medusa/**",
    ],
    rules: restrict(UI_PACKAGES, DOMAINS, MODULES, FRAMEWORK_SERVER_MODULES, MEDUSA_SERVER_PACKAGES),
  },

  // ui packages: isomorphic framework entries, admin-safe Medusa
  {
    files: ["packages/ui/*/src/**"],
    rules: restrict(DOMAINS, FRAMEWORK_SERVER_ENTRIES, MEDUSA_SERVER_PACKAGES),
  },

  // domains and modules (server side): no domain, no UI packages
  {
    files: ["packages/domains/*/src/**", "packages/modules/*/src/**"],
    ignores: ["packages/domains/*/src/admin/**", "packages/modules/*/src/admin/**"],
    rules: restrict(DOMAINS, UI_PACKAGES),
  },
  // admin code (domain admin, each module's admin/): no domain, no server code
  {
    files: ["packages/domains/*/src/admin/**", "packages/modules/*/src/admin/**"],
    rules: restrict(DOMAINS, FRAMEWORK_SERVER_ENTRIES, MEDUSA_SERVER_PACKAGES, PLUGIN_SERVER_FOLDERS),
  },

  // reusable modules: own files + declared dependencies' entities only
  {
    files: ["packages/modules/*/src/**"],
    rules: { "layers/module-boundaries": "error" },
  },
];

export default layers;
