import { MedusaService } from "@medusajs/framework/utils";
import {
  RbacCategory,
  RbacPermission,
  RbacPolicy,
  RbacMember,
  RbacRole,
} from "../models";

class RbacModuleService extends MedusaService({
  RbacCategory,
  RbacPermission,
  RbacPolicy,
  RbacMember,
  RbacRole,
}) {}

export default RbacModuleService;
