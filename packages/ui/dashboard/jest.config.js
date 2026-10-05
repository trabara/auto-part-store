module.exports = {
  ...require("@repo/config/jest/base.cjs"),
  testTimeout: 10000,
  testMatch: ["**/src/**/*.spec.[jt]s?(x)"],
};
