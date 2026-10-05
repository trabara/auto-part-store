/**
 * Base Jest config for every workspace: TypeScript/TSX through SWC (with
 * decorators and the automatic JSX runtime), Node environment.
 *
 *   // jest.config.js
 *   module.exports = require("@repo/config/jest/base.cjs")
 */
module.exports = {
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: true, decorators: true },
          transform: { react: { runtime: "automatic" } },
          target: "es2022",
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "tsx", "json"],
  modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/.medusa/"],
};
