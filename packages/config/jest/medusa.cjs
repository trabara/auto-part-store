/**
 * Jest config for Medusa apps and plugins.
 *
 *   // jest.config.js
 *   module.exports = require("@repo/config/jest/medusa.cjs")(__dirname)
 *
 * - loads `<rootDir>/.env.test` (git-ignored, personal overrides), then the
 *   committed `<rootDir>/.env.test.example` defaults
 * - `TEST_TYPE` selects the suite:
 *     unit                → src/**\/__tests__/**\/*.unit.spec.ts
 *     integration:http    → integration-tests/http/*.spec.ts
 *     integration:modules → src/modules/*\/__tests__/**\/*.ts
 * - integration suites get a per-worker temp database, dropped afterwards
 * - `~/…` maps to `<rootDir>/src/…` (the plugin tsconfig alias)
 * - `@repo/module-<name>[/entry]` maps to the module's source
 *   (`.` → packages/modules/<name>/src/server, `/entry` → src/<entry>): tests
 *   run on source, and the modules a test project loads by path are the same
 *   files
 */
const path = require("path");
const dotenv = require("dotenv");
const base = require("./base.cjs");

const MODULES = path.resolve(__dirname, "../../modules");

const SUITES = {
  unit: ["**/src/**/__tests__/**/*.unit.spec.[jt]s?(x)"],
  "integration:http": ["**/integration-tests/http/*.spec.[jt]s"],
  "integration:modules": ["**/src/modules/*/__tests__/**/*.[jt]s"],
};

module.exports = function medusaJestConfig(rootDir, overrides = {}) {
  // First file wins: dotenv never overrides a variable that is already set.
  dotenv.config({ path: path.join(rootDir, ".env.test"), quiet: true });
  dotenv.config({ path: path.join(rootDir, ".env.test.example"), quiet: true });

  const type = process.env.TEST_TYPE;
  const integration = type === "integration:http" || type === "integration:modules";

  return {
    ...base,
    rootDir,
    testTimeout: integration ? 60_000 : 10_000,
    moduleNameMapper: {
      "^~/(.*)$": "<rootDir>/src/$1",
      "^@repo/module-([^/]+)$": `${MODULES}/$1/src/server`,
      "^@repo/module-([^/]+)/(.*)$": `${MODULES}/$1/src/$2`,
    },
    ...(SUITES[type] ? { testMatch: SUITES[type] } : {}),
    ...(integration
      ? {
          setupFiles: [require.resolve("./setup-env.cjs")],
          setupFilesAfterEnv: [require.resolve("./setup-db.cjs")],
        }
      : {}),
    ...overrides,
  };
};
