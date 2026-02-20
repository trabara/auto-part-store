import * as z from "@medusajs/framework/zod";
import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators";

export const FuelTypeSchema = z.enum([
  "GASOLINE",
  "DIESEL",
  "ELECTRIC",
  "HYBRID",
]);
export type FuelType = z.infer<typeof FuelTypeSchema>;
export const DriveTypeSchema = z.enum(["FWD", "RWD", "AWD", "FOUR_WD"]);
export type DriveType = z.infer<typeof DriveTypeSchema>;
export const TransmissionTypeSchema = z.enum(["MANUAL", "AUTOMATIC", "CVT"]);
export type TransmissionType = z.infer<typeof TransmissionTypeSchema>;
export const BodyStyleTypeSchema = z.enum([
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "COUPE",
  "CONVERTIBLE",
  "WAGON",
  "VAN",
  "PICKUP",
]);
export type BodyStyleType = z.infer<typeof BodyStyleTypeSchema>;
export const EngineTypeSchema = z.enum([
  "I4",
  "V4",
  "V6",
  "V8",
  "ELECTRIC",
  "HYBRID",
]);
export type EngineType = z.infer<typeof EngineTypeSchema>;

const Base = z.object({
  id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

type Base = z.infer<typeof Base>;

const BASE_MASK: z.util.Exactly<
  {
    created_at: true;
    updated_at: true;
    deleted_at: true;
    id: true;
  },
  Base
> = {
  created_at: true,
  updated_at: true,
  deleted_at: true,
  id: true,
};

export const MakeSchema = Base.extend({
  name: z.string(),
});

export type Make = z.infer<typeof MakeSchema>;

export const ModelSchema = Base.extend({
  name: z.string(),
  make: MakeSchema,
});

export type Model = z.infer<typeof ModelSchema>;

export const EngineSchema = Base.extend({
  fuel: FuelTypeSchema.default("GASOLINE"),
  type: EngineTypeSchema.default("I4"),
  size: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .default("1.0"),
  tech: z.string().optional(),
});

export type Engine = z.infer<typeof EngineSchema>;

export const FitmentSchema = Base.extend({
  body_style: BodyStyleTypeSchema.default("SEDAN"),
  doors: z.number().min(2).max(6).default(4),
  drive: DriveTypeSchema.default("FWD"),
  transmission: TransmissionTypeSchema.default("MANUAL"),
  year_start: z.number(),
  year_end: z.number().optional(),
});

export type Fitment = z.infer<typeof FitmentSchema>;

export const CreateMakeSchema = MakeSchema.omit(BASE_MASK)

export type CreateMakeInput = z.infer<typeof CreateMakeSchema>;

// Support both make_id reference and nested make object
export const CreateModelSchema = z.union([
  // Format 1: Reference by make_id
  ModelSchema.omit({ ...BASE_MASK, make: true }).extend({
    make_id: z.string(),
    id: z.string().optional(),
  }),
  // Format 2: Nested make object
  ModelSchema.omit(BASE_MASK).extend({
    make: CreateMakeSchema,
    id: z.string().optional(),
  }),
]);
export type CreateModelInput = z.infer<typeof CreateModelSchema>;

// Helper for validation middleware (wraps the union in a superRefine)
export const CreateModelValidationSchema = z
  .object({
    name: z.string(),
    make_id: z.string().optional(),
    make: CreateMakeSchema.optional(),
    id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.make_id && !data.make) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either make_id or make must be provided",
        path: ["make_id"],
      });
    }
    if (data.make_id && data.make) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot provide both make_id and make",
        path: ["make_id"],
      });
    }
  });

export const CreateEngineSchema = EngineSchema.omit(BASE_MASK)

export type CreateEngineInput = z.infer<typeof CreateEngineSchema>;

export const CreateFitmentSchema = FitmentSchema.omit(BASE_MASK).extend({
  model_id: z.string(),
  engine_id: z.string(),
  product_id: z.string().optional(),
});

export type CreateFitmentInput = z.infer<typeof CreateFitmentSchema>;

export const UpdateFitmentSchema = FitmentSchema.omit(BASE_MASK)
  .partial()
  .extend({
    id: z.string(),
    model_id: z.string(),
    engine_id: z.string(),
  });

export type UpdateFitmentInput = z.infer<typeof UpdateFitmentSchema>;

// Update schemas for Make, Model, and Engine
export const UpdateMakeSchema = z.object({
  name: z.string().optional(),
});

export type UpdateMakeInput = z.infer<typeof UpdateMakeSchema>;

export const UpdateModelSchema = z.object({
  name: z.string().optional(),
  make_id: z.string().optional(),
});

export type UpdateModelInput = z.infer<typeof UpdateModelSchema>;

export const UpdateEngineSchema = z.object({
  fuel: FuelTypeSchema.optional(),
  type: EngineTypeSchema.optional(),
  size: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .optional(),
  tech: z.string().optional(),
});

export type UpdateEngineInput = z.infer<typeof UpdateEngineSchema>;

const findParams = createFindParams();

export const FitmentFindParamsSchema = findParams.extend({
  filters: z
    .object({
      model: z
        .object({
          name: createOperatorMap(z.string()),
          make: z
            .object({
              name: createOperatorMap(z.string()),
            })
            .optional(),
        })
        .optional(),
      engine: z
        .object({
          size: createOperatorMap(z.string()),
          fuel: createOperatorMap(z.string()),
        })
        .optional(),
      body_style: createOperatorMap(z.string()).optional(),
      drive: createOperatorMap(z.string()).optional(),
      transmission: createOperatorMap(z.string()).optional(),
      year_start: createOperatorMap(z.number()).optional(),
      year_end: createOperatorMap(z.number()).optional(),
    })
    .optional(),
});

export const ModelFindParamsSchema = findParams.extend({
  filters: z
    .object({
      name: createOperatorMap(z.string()).optional(),
      make_id: createOperatorMap(z.string()).optional(),
      make: z
        .object({
          name: createOperatorMap(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

export const LinkProductsSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, "At least one product ID is required"),
});

export const MakeFindParamsSchema = findParams.extend({
  filters: z
    .object({
      name: createOperatorMap(z.string()).optional(),
    })
    .optional(),
});