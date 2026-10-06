// Vehicle selector (Year / Make / Model / Generation / Vehicle) for the storefront.
import type { MedusaRequest } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";
import type { StoreSelectorParams } from "../validators";

export const vehicleService = (req: MedusaRequest<any>) => req.scope.resolve<VehicleModuleService>(VEHICLE_MODULE);

export const params = (req: MedusaRequest<any>) => req.validatedQuery as StoreSelectorParams;

export function required(value: string | undefined, name: string): string {
  if (!value) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${name} is required`);
  return value;
}
