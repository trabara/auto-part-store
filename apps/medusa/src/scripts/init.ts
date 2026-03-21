import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function init({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const apiKeyService = container.resolve(Modules.API_KEY);

  logger.info("Starting initialization...");

  logger.info("Extracting publishable API key...");
  const keys = await apiKeyService.listApiKeys({
    type: "publishable" as any,
  });

  if (keys[0]) {
    const key = keys[0] as any;
    logger.info(`Found publishable key: ${key.token}`);
    process.stdout.write(`__KEY__${key.token}__KEY__`);
  } else {
    throw new Error("No publishable key found in database");
  }
}
