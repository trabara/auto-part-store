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
 * try to resolve @repo/vehicle-fitment-plugin/admin before the admin
 * extension output exists at .medusa/server/src/admin/index.mjs.
 */

import { Compiler } from "@medusajs/framework/build-tools";
import { logger } from "@medusajs/framework/logger";
import path from "path";

const pluginDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

const compiler = new Compiler(pluginDir, logger);
const parsedConfig = await compiler.loadTSConfigFile();
if (!parsedConfig) {
  logger.error("Unable to load tsconfig");
  process.exit(1);
}

// Step 1: Build backend (wipes .medusa/server, then compiles TS)
const backendOk = await compiler.buildPluginBackend(parsedConfig);
if (!backendOk) {
  logger.error("Plugin backend build failed");
  process.exit(1);
}

// Step 2: Build admin extensions (writes .medusa/server/src/admin/index.mjs)
const bundler = await import("@medusajs/admin-bundler");
const adminOk = await compiler.buildPluginAdminExtensions(bundler);
if (!adminOk) {
  logger.error("Plugin admin extensions build failed");
  process.exit(1);
}

process.exit(0);
