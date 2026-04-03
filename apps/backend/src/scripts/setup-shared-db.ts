import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { Client } from "pg";

export default async function setupSharedDb({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const tenantName = process.env.TENANT_NAME;
  const sharedDbPass = process.env.SHARED_DB_PASS;

  if (!tenantName || !sharedDbPass) {
    logger.info(
      "Not a shared tier tenant (TENANT_NAME or SHARED_DB_PASS not set), skipping shared DB setup",
    );
    return;
  }

  logger.info(`Setting up shared_user for tenant: ${tenantName}`);

  // Step 1: Create or update shared_user role
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("BEGIN");

  try {
    const roleResult = await client.query(
      `SELECT 1 FROM pg_roles WHERE rolname = 'shared_user'`,
    );

    // Escape single quotes in password for SQL string literal
    const escapedPass = sharedDbPass.replace(/'/g, "''");

    if (roleResult.rows.length === 0) {
      await client.query(
        `CREATE ROLE shared_user WITH LOGIN PASSWORD '${escapedPass}'`,
      );
      logger.info("Created shared_user role");
    } else {
      await client.query(
        `ALTER ROLE shared_user WITH LOGIN PASSWORD '${escapedPass}'`,
      );
      logger.info("Updated shared_user password");
    }
  } finally {
    await client.query("COMMIT");
  }

  // Step 2: GRANT ALL PRIVILEGES ON DATABASE (cannot run inside a transaction)
  try {
    await client.query(
      `GRANT ALL PRIVILEGES ON DATABASE "${tenantName}" TO shared_user`,
    );
    logger.info(
      `Granted ALL PRIVILEGES on database "${tenantName}" to shared_user`,
    );
  } finally {
    await client.query("COMMIT");
    await client.end();
  }

  logger.info("Shared DB setup complete");
}
