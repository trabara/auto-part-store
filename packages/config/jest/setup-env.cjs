// Integration suites: one temp database per Jest worker (dropped by setup-db.cjs).
if (process.env.DB_TEMP_NAME === undefined) {
  const worker = parseInt(process.env.JEST_WORKER_ID || "1", 10);
  const chunk = parseInt(process.env.CHUNK || "1", 10);
  process.env.DB_TEMP_NAME = `medusa-integration-${worker}-${chunk}`;
}
process.env.LOG_LEVEL ??= "error";
globalThis.performance ??= require("perf_hooks").performance;
