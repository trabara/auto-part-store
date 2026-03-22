import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function initRbac({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const userService = container.resolve(Modules.USER);
  const rbacService = container.resolve(Modules.RBAC);

  const adminEmail = process.env.MEDUSA_ADMIN_EMAIL;

  if (!adminEmail) {
    logger.warn("MEDUSA_ADMIN_EMAIL not set, skipping RBAC init");
    return;
  }

  logger.info(`Initializing RBAC for admin user: ${adminEmail}`);

  const users = await userService.listUsers({
    email: adminEmail,
  });

  if (!users.length) {
    logger.warn(`Admin user ${adminEmail} not found, skipping RBAC init`);
    return;
  }

  const adminUser = users[0];
  logger.info(`Found admin user: ${adminUser.id}`);

  const existingRoles = await rbacService.listRbacRoles({ name: "Admin" });

  let adminRole;
  if (existingRoles.length > 0) {
    adminRole = existingRoles[0];
    logger.info(`Admin role already exists: ${adminRole.id}`);
  } else {
    const created = await rbacService.createRbacRoles([
      {
        name: "Admin",
        description: "Full admin access",
        metadata: { is_super: true },
      },
    ]);
    adminRole = created[0];
    logger.info(`Created Admin role: ${adminRole.id}`);
  }

  const existingPolicies = await rbacService.listRbacPolicies({
    resource: "admin",
    operation: "*",
  });

  let wildcardPolicy;
  if (existingPolicies.length > 0) {
    wildcardPolicy = existingPolicies[0];
  } else {
    const created = await rbacService.createRbacPolicies([
      {
        key: "admin.all",
        resource: "admin",
        operation: "*",
        name: "Full Admin Access",
        description: "All admin operations",
      },
    ]);
    wildcardPolicy = created[0];
    logger.info(`Created wildcard policy: ${wildcardPolicy.id}`);
  }

  const existingRolePolicies = await rbacService.listRbacRolePolicies({
    role_id: adminRole.id,
    policy_id: wildcardPolicy.id,
  });

  if (existingRolePolicies.length === 0) {
    await rbacService.createRbacRolePolicies([
      {
        role_id: adminRole.id,
        policy_id: wildcardPolicy.id,
      },
    ]);
    logger.info(`Linked Admin role to wildcard policy`);
  }

  logger.info(`Assigning Admin role to user ${adminUser.id}`);

  try {
    await link.create({
      [Modules.USER]: {
        user_id: adminUser.id,
      },
      [Modules.RBAC]: {
        rbac_role_id: adminRole.id,
      },
    });
    logger.info(`Successfully assigned Admin role to user ${adminUser.id}`);
  } catch (err) {
    if (
      err.message?.includes("already exists") ||
      err.message?.includes("duplicate")
    ) {
      logger.info(`User already assigned to Admin role`);
    } else {
      throw err;
    }
  }
}
