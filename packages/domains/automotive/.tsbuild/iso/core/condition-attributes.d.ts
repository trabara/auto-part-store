import type { ConditionAttribute } from "@repo/module-fitment/contract";
/** "PLUG_IN_HYBRID" → "Plug-in hybrid" (overrides for acronyms and drives). */
export declare const vehicleValueLabel: (value: string) => string;
/**
 * Every vehicle field a condition can test, generated from the vehicle schemas.
 * Drive first: the editor starts new conditions on the first attribute.
 */
export declare const VEHICLE_ATTRIBUTES: readonly ConditionAttribute[];
/** Vehicle paths conditions read: the fields to load on the tested vehicle. */
export declare const VEHICLE_ATTRIBUTE_PATHS: readonly string[];
