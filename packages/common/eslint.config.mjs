import { config as baseConfig } from "@repo/eslint-config/base";

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
