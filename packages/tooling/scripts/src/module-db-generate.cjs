#!/usr/bin/env node
/**
 * Migrations from entity changes, for a module package
 * (packages/modules/<name>): Medusa's `plugin:db:generate` for one module
 * whose sources sit in `src/` (index.ts, models/, migrations/).
 *
 * Usage (from the module's package, env from .env.test[.example]):
 *   module-db-generate [moduleDir]
 */
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const dir = path.resolve(process.argv[2] ?? process.cwd());
const src = path.join(dir, "src");
const local = createRequire(path.join(dir, "package.json"));

// Load the module's TypeScript sources (decorators: the module's tsconfig).
local("ts-node").register({ project: path.join(dir, "tsconfig.json"), transpileOnly: true });

const { logger } = local("@medusajs/framework/logger");
const { DmlEntity, defineMikroOrmCliConfig } = local("@medusajs/framework/utils");
const { MetadataStorage } = local("@medusajs/framework/mikro-orm/core");
const { MikroORM } = local("@medusajs/framework/mikro-orm/postgresql");

async function main() {
  const module = require(path.join(src, "index.ts")).default;
  if (!module?.service) throw new Error(`${src}/index.ts should default export the Module()`);
  const serviceName = module.service.prototype.__joinerConfig().serviceName;

  const modelsDir = path.join(src, "models");
  const entities = fs
    .readdirSync(modelsDir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts") && f !== "index.ts")
    .flatMap((f) => Object.values(require(path.join(modelsDir, f))))
    .filter((e) => DmlEntity.isDmlEntity(e) || Object.hasOwn(e, MetadataStorage.PATH_SYMBOL));
  if (!entities.length) return logger.info(`No entities found for module ${serviceName}`);

  logger.info(`Generating migrations for module ${serviceName}...`);
  const orm = await MikroORM.init(
    defineMikroOrmCliConfig(serviceName, {
      entities,
      host: process.env.DB_HOST ?? "localhost",
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      user: process.env.DB_USERNAME ?? "",
      password: process.env.DB_PASSWORD ?? "",
      ...(process.env.DATABASE_URL ? { clientUrl: process.env.DATABASE_URL } : {}),
      migrations: { path: path.join(src, "migrations") },
    }),
  );
  try {
    const result = await orm.getMigrator().createMigration();
    logger.info(result.fileName ? `Migration created: ${result.fileName}` : "No migration created");
  } finally {
    await orm.close(true);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    logger.error(error.message, error);
    process.exit(1);
  },
);
