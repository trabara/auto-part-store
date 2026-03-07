#!/usr/bin/env node
/**
 * Plugin dev watch script — incremental backend watcher + admin HMR.
 *
 * Usage:
 *   node node_modules/@repo/scripts/src/develop-watch.mjs <pluginDir> <medusaAppDir>
 *
 * Assumes develop-init.mjs has already run the initial build
 * (buildPluginBackend + buildPluginAdminExtensions). This script:
 *
 *   1. Watches src/ (excluding src/admin) via developPluginBackend:
 *      - SWC-transpiles each changed .ts file into .medusa/server/src/
 *      - Then touches <medusaAppDir>/src/plugin-reload.ts so that Medusa's
 *        own chokidar watcher (in `medusa develop`) detects a change and
 *        restarts the backend server process.
 *
 *   2. Watches src/admin/ via a separate chokidar watcher:
 *      - Re-runs buildPluginAdminExtensions (Vite build) on any change,
 *        regenerating .medusa/server/src/admin/index.mjs
 *      - Touches <medusaAppDir>/.medusa/client/entry.jsx so that the Vite
 *        dev server (inside `medusa develop`) invalidates and re-imports
 *        the freshly built plugin admin bundle.
 *
 * Run order (managed by turbo):
 *   1. plugin:dev:init  (develop-init.mjs)  — builds backend + admin, exits
 *   2. medusa:dev       (medusa develop)     — starts with admin output present
 *      plugin:dev       (this script)        — watches for file changes
 */

import { Compiler } from "@medusajs/framework/build-tools";
import { logger } from "@medusajs/framework/logger";
import * as swcCore from "@swc/core";
import chokidar from "chokidar";
import { utimes, writeFile } from "fs/promises";
import path from "path";

const pluginDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();

const medusaAppDir = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(pluginDir, "../../apps/medusa");

// Sentinel file inside apps/medusa/src — touching it triggers Medusa's
// chokidar watcher to restart the backend server.
const backendSentinel = path.resolve(medusaAppDir, "src/plugin-reload.ts");

// Vite entry file — touching it tells the Vite dev server to re-import
// the freshly rebuilt plugin admin bundle.
const viteEntry = path.resolve(medusaAppDir, ".medusa/client/entry.jsx");

/**
 * Touch a file (update mtime without changing content) to signal watchers.
 * Falls back to writing a comment if the file doesn't exist yet.
 */
async function touchFile(filePath) {
  const now = new Date();
  try {
    await utimes(filePath, now, now);
  } catch {
    // File may not exist yet — create it
    await writeFile(filePath, "");
  }
}

// ─── Backend watcher ────────────────────────────────────────────────────────

const compiler = new Compiler(pluginDir, logger);
const parsedConfig = await compiler.loadTSConfigFile();
if (!parsedConfig) {
  logger.error("Unable to load tsconfig");
  process.exit(1);
}

async function transformFile(filePath) {
  const output = await swcCore.transformFile(filePath, {
    sourceMaps: "inline",
    module: {
      type: "commonjs",
      strictMode: true,
      noInterop: false,
    },
    jsc: {
      externalHelpers: false,
      target: "es2021",
      parser: {
        syntax: "typescript",
        tsx: true,
        decorators: true,
        dynamicImport: true,
      },
      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
        react: {
          throwIfNamespace: false,
          useBuiltins: false,
          pragma: "React.createElement",
          pragmaFrag: "React.Fragment",
          importSource: "react",
          runtime: "automatic",
        },
      },
      keepClassNames: true,
      baseUrl: pluginDir,
    },
  });
  return output.code;
}

/**
 * Called by developPluginBackend after each successful SWC compile.
 * Touches apps/medusa/src/plugin-reload.ts to trigger Medusa's watcher.
 */
async function onBackendFileChange(file) {
  logger.info(
    `[plugin-dev] Backend changed: ${path.relative(pluginDir, file)} — signalling Medusa restart`,
  );
  await touchFile(backendSentinel);
}

// Start the backend file watcher (no initial build — develop-init.mjs ran it)
compiler.developPluginBackend(transformFile, onBackendFileChange);

// ─── Admin watcher ───────────────────────────────────────────────────────────

const adminSrcDir = path.resolve(pluginDir, "src/admin");
let adminDebounceTimer = null;
let adminBuildRunning = false;
let adminBuildQueued = false;

/**
 * Run buildPluginAdminExtensions, serialising concurrent requests:
 * if a build is already in flight, queue one follow-up build instead of
 * spawning duplicates.
 */
async function runAdminBuild() {
  if (adminBuildRunning) {
    adminBuildQueued = true;
    return;
  }
  adminBuildRunning = true;
  adminBuildQueued = false;

  logger.info(
    "[plugin-dev] Admin source changed — rebuilding plugin admin extensions...",
  );
  try {
    const bundler = await import("@medusajs/admin-bundler");
    const ok = await compiler.buildPluginAdminExtensions(bundler);
    if (ok) {
      logger.info(
        "[plugin-dev] Plugin admin extensions rebuilt — signalling Vite reload",
      );
      await touchFile(viteEntry);
    } else {
      logger.error("[plugin-dev] Plugin admin extensions build failed");
    }
  } catch (err) {
    logger.error(
      "[plugin-dev] Plugin admin extensions build threw an error",
      err,
    );
  } finally {
    adminBuildRunning = false;
    if (adminBuildQueued) {
      runAdminBuild();
    }
  }
}

/**
 * Debounce + serialise admin rebuilds.
 * Waits 150 ms after the last filesystem event before triggering a build,
 * so rapid saves (e.g. editor auto-format on save) collapse into one build.
 */
function scheduleAdminBuild() {
  if (adminDebounceTimer) {
    clearTimeout(adminDebounceTimer);
  }
  adminDebounceTimer = setTimeout(() => {
    adminDebounceTimer = null;
    runAdminBuild();
  }, 150);
}

const adminWatcher = chokidar.watch(adminSrcDir, {
  ignoreInitial: true,
  ignored: [
    // dot files / directories
    /(^|[\\/])\../,
    // generated by @medusajs/admin-vite-plugin buildStart hook — must not
    // re-trigger a build or we get an infinite loop
    /__admin-extensions__\.(js|ts)$/,
  ],
});

adminWatcher.on("add", scheduleAdminBuild);
adminWatcher.on("change", scheduleAdminBuild);
adminWatcher.on("unlink", scheduleAdminBuild);
adminWatcher.on("ready", () => {
  logger.info(`[plugin-dev] Watching src/admin for changes`);
});
