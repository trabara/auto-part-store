import { defineConfig, type Options } from "tsup";

const entry = {
  "admin/plugins/index": "src/admin/plugins/index.ts",
  "admin/index": "src/admin/index.ts",
  "core/index": "src/core/index.ts",
  "http/index": "src/http/index.ts",
  "orm/index": "src/orm/index.ts",
  "utils/index": "src/utils/index.ts",
};

const shared: Options = {
  entry,
  target: "node20",
  tsconfig: "tsconfig.build.json",
  // dependencies and peerDependencies are externalized automatically
};

export default defineConfig([
  {
    ...shared,
    format: "esm",
    outDir: "dist/esm",
    outExtension: () => ({ js: ".mjs", dts: ".d.mts" }),
  },
  {
    ...shared,
    format: "cjs",
    outDir: "dist/cjs",
    outExtension: () => ({ js: ".cjs", dts: ".d.cts" }),
  },
]);
