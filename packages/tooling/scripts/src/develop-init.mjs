#!/usr/bin/env node
/**
 * Plugin dev init script — runs the initial build (backend + admin) and exits.
 *
 * Usage:
 *   node --import @repo/scripts/develop-init <pluginDir>
 *   node node_modules/@repo/scripts/src/develop-init.mjs <pluginDir>
 *
 * This is split from develop-watch.mjs so that turbo can:
 *   1. Run dev:init (this script) as a non-persistent task
 *   2. Then start medusa:dev (which depends on ^dev:init completing)
 *   3. Concurrently run plugin:dev (develop-watch.mjs, file watcher only)
 *
 * This eliminates the race condition where medusa:dev's Vite server would
 * try to resolve @repo/automotive-plugin/admin before the admin
 * extension output exists at .medusa/server/src/admin/index.mjs.
 */

import { Compiler } from "@medusajs/framework/build-tools";
import { logger } from "@medusajs/framework/logger";
import path from "path";

const pluginDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

const compiler = new Compiler(pluginDir, logger);

const tsConfig = await compiler.loadTSConfigFile();
if (!tsConfig) {
  logger.error("Unable to compile plugin");
  process.exit(1);
}

const bundler = await import("@medusajs/admin-bundler");
const responses = await Promise.all([
  compiler.buildPluginBackend(tsConfig),
  compiler.buildPluginAdminExtensions(bundler),
]);

if (responses.every((response) => response === true)) {
  process.exit(0);
} else {
  process.exit(1);
}
