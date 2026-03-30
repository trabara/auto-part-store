import { LoaderOptions } from "@medusajs/framework/types";
import AuthzModuleService from "../services/authz.service";
import { AUTHZ_MODULE } from "..";

export default async function createDefaultPolicies({
    container,
}: LoaderOptions) {
  const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
  await service.syncRegisteredPolicies();
}