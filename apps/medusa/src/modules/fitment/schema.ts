import * as z from "@medusajs/framework/zod";

export const FuelTypeSchema = z.enum(["gasoline", "diesel", "electric", "hybrid"]);
export type FuelType = z.infer<typeof FuelTypeSchema>;
export const DriveTypeSchema = z.enum(["fwd", "rwd", "awd"]);
export type DriveType = z.infer<typeof DriveTypeSchema>;
export const TransmissionTypeSchema = z.enum(["manual", "automatic", "cvt"]);
export type TransmissionType = z.infer<typeof TransmissionTypeSchema>;
export const BodyStyleTypeSchema = z.enum(["sedan", "suv", "hatchback", "coupe", "convertible"]);
export type BodyStyleType = z.infer<typeof BodyStyleTypeSchema>;
export const EngineTypeSchema = z.enum(["I4", "V4", "V6", "V8", "Electric", "Hybrid"]);
export type EngineType = z.infer<typeof EngineTypeSchema>;

export const MakeSchema = z.object({
    name: z.string(),
})

export type Make = z.infer<typeof MakeSchema>;

export const ModelSchema = z.object({
    name: z.string(),
    make: MakeSchema,
})

export type Model = z.infer<typeof ModelSchema>;

export const EngineSchema = z.object({
    fuel: FuelTypeSchema.default("gasoline"),
    type: EngineTypeSchema.default("I4"),
    size: z.string().regex(/^\d+(\.\d+)?$/).default("1.0"),
    tech: z.string().optional(),
})

export type Engine = z.infer<typeof EngineSchema>;

export const FitmentSchema = z.object({
    body_style: BodyStyleTypeSchema.default("sedan"),
    drive: DriveTypeSchema.default("fwd"),
    transmission: TransmissionTypeSchema.default("manual"),
    year_start: z.number(),
    year_end: z.number(),
    model: ModelSchema,
    engine: EngineSchema,
})

export type Fitment = z.infer<typeof FitmentSchema>;