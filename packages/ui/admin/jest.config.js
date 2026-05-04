module.exports = {
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: true, decorators: false },
          target: "es2022",
        },
      },
    ],
  },
  testEnvironment: "node",
  testTimeout: 10000,
  moduleFileExtensions: ["js", "ts", "tsx", "json"],
  testMatch: ["**/src/**/__tests__/**/*.spec.[jt]s?(x)"],
  moduleNameMapper: {
    // Resolve @medusajs/framework/zod to the actual module (lives in root node_modules)
    "@medusajs/framework/zod":
      "<rootDir>/../../../node_modules/@medusajs/framework/dist/deps/zod.js",
  },
};
