import { config as baseConfig } from "@repo/config/eslint/base.js";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  { ignores: [".medusa/**", ".tsbuild/**", "dist/**", "node_modules/**"] },
];
