import { z } from "@medusajs/framework/zod";
/** Product listing params shared by the parts endpoints. */
export declare const StorePartsParams: z.ZodObject<{
    region_id: z.ZodOptional<z.ZodString>;
    category_id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    brand_id: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const StoreVehiclePartsParams: z.ZodObject<{
    region_id: z.ZodOptional<z.ZodString>;
    category_id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    brand_id: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    build_year: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    build_month: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const StorePartSearchParams: z.ZodObject<{
    region_id: z.ZodOptional<z.ZodString>;
    category_id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    brand_id: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    q: z.ZodString;
}, z.core.$strip>;
export declare const StoreSelectorParams: z.ZodObject<{
    make_id: z.ZodOptional<z.ZodString>;
    model_id: z.ZodOptional<z.ZodString>;
    generation_id: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type StorePartsParams = z.infer<typeof StorePartsParams>;
export type StoreVehiclePartsParams = z.infer<typeof StoreVehiclePartsParams>;
export type StorePartSearchParams = z.infer<typeof StorePartSearchParams>;
export type StoreSelectorParams = z.infer<typeof StoreSelectorParams>;
/** Garage payloads: the customer comes from the session, never the body. */
export declare const GarageCreateSchema: z.ZodObject<{
    build_year: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    build_month: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    nickname: z.ZodNullable<z.ZodString>;
    vin: z.ZodNullable<z.ZodString>;
    registration: z.ZodNullable<z.ZodString>;
    is_default: z.ZodDefault<z.ZodBoolean>;
    vehicle_id: z.ZodString;
}, z.core.$strip>;
export declare const GarageUpdateSchema: z.ZodObject<{
    build_year: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    build_month: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    nickname: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    vin: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    registration: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_default: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    vehicle_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
