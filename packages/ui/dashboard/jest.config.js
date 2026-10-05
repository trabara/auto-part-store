module.exports = {
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: true, decorators: false },
          transform: { react: { runtime: "automatic" } },
          target: "es2022",
        },
      },
    ],
  },
  testEnvironment: "node",
  testTimeout: 10000,
  moduleFileExtensions: ["js", "ts", "tsx", "json"],
  testMatch: ["**/src/**/*.spec.[jt]s?(x)"],
};
