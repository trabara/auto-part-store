import type { AuthenticatedMedusaRequest, MedusaRequest } from "@medusajs/framework/http";
import { type VehicleModuleService } from "@repo/module-vehicle";
import type { StoreSelectorParams } from "./store/validators";
export declare const vehicleService: (req: MedusaRequest<any>) => VehicleModuleService;
/** Selector query parameters (validated by the middleware). */
export declare const selectorParams: (req: MedusaRequest<any>) => StoreSelectorParams;
/** A required selector parameter (400 when missing). */
export declare function required(value: string | undefined, name: string): string;
/** Garage writes go through the framework's workflows on this target. */
export declare const GARAGE_TARGET: {
    module: string;
    entity: string;
};
export declare const customerId: (req: AuthenticatedMedusaRequest<any>) => string;
/** 404 unless the garage vehicle belongs to the logged-in customer. */
export declare const ownGarageVehicle: (req: AuthenticatedMedusaRequest<any>, id: string) => ReturnType<VehicleModuleService["retrieveGarageVehicle"]>;
