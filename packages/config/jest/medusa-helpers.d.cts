import type { MedusaContainer } from "@medusajs/framework/types";

/** Creates an admin user and returns axios options with its bearer token. */
export declare function adminHeaders(
  container: MedusaContainer,
  email?: string,
): Promise<{ headers: { authorization: string } }>;
