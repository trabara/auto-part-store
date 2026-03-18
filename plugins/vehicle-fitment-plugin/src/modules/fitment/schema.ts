import * as z from "@medusajs/framework/zod";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
import { BASE_MASK, BaseSchema } from "@repo/common";

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

export const MakeSchema = BaseSchema.extend({
  name: z.string(),
});
export type Make = z.infer<typeof MakeSchema>;

export const ModelSchema = BaseSchema.extend({
  name: z.string(),
  make: MakeSchema,
});
export type Model = z.infer<typeof ModelSchema>;

export const EngineSchema = BaseSchema.extend({
  fuel: FuelTypeSchema.default("GASOLINE"),
  type: EngineTypeSchema.default("I4"),
  size: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .default("1.0"),
  tech: z.string().optional(),
});

export type Engine = z.infer<typeof EngineSchema>;

export const FitmentSchema = BaseSchema.extend({
  body_style: BodyStyleTypeSchema.default("SEDAN"),
  doors: z.number().min(2).max(6).default(4),
  drive: DriveTypeSchema.default("FWD"),
  transmission: TransmissionTypeSchema.default("MANUAL"),
  year_start: z.number(),
  year_end: z.number().optional(),
});
export type Fitment = z.infer<typeof FitmentSchema>;

export const CreateMakeInputSchema = MakeSchema.omit(BASE_MASK);
export type CreateMakeInput = z.infer<typeof CreateMakeInputSchema>;

export const CreateModelInputSchema = z.object({
  name: z.string(),
  make_id: z.string(),
});
export type CreateModelInput = z.infer<typeof CreateModelInputSchema>;

export const CreateEngineInputSchema = EngineSchema.omit(BASE_MASK);
export type CreateEngineInput = z.infer<typeof CreateEngineInputSchema>;

export const CreateFitmentInputSchema = FitmentSchema.omit(BASE_MASK).extend({
  model_id: z.string(),
  engine_id: z.string(),
  product_id: z.string().optional(),
});
export type CreateFitmentInput = z.infer<typeof CreateFitmentInputSchema>;

export const UpdateFitmentInputSchema = FitmentSchema.omit(BASE_MASK)
  .partial()
  .extend({
    id: z.string(),
    model_id: z.string(),
    engine_id: z.string(),
  });
export type UpdateFitmentInput = z.infer<typeof UpdateFitmentInputSchema>;

export const UpdateMakeInputSchema = z.object({
  name: z.string().optional(),
});
export type UpdateMakeInput = z.infer<typeof UpdateMakeInputSchema>;

export const UpdateModelInputSchema = z.object({
  name: z.string().optional(),
  make_id: z.string().optional(),
});
export type UpdateModelInput = z.infer<typeof UpdateModelInputSchema>;

export const UpdateEngineInputSchema = z.object({
  fuel: FuelTypeSchema.optional(),
  type: EngineTypeSchema.optional(),
  size: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .optional(),
  tech: z.string().optional(),
});
export type UpdateEngineInput = z.infer<typeof UpdateEngineInputSchema>;

export const LinkProductsInputSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, "At least one product ID is required"),
});

export const BaseFindParams = createFindParams();

export const FitmentFindParamsSchema = BaseFindParams.extend({
  filters: z
    .object({
      model: z
        .object({
          name: createOperatorMap(z.string()).optional(),
          make: z
            .object({
              name: createOperatorMap(z.string()).optional(),
            })
            .optional(),
        })
        .optional(),
      engine: z
        .object({
          size: createOperatorMap(z.string()).optional(),
          fuel: createOperatorMap(z.string()).optional(),
        })
        .optional(),
      body_style: createOperatorMap(z.string()).optional(),
      drive: createOperatorMap(z.string()).optional(),
      transmission: createOperatorMap(z.string()).optional(),
      year_start: createOperatorMap(z.coerce.number()).optional(),
      year_end: createOperatorMap(z.coerce.number()).optional(),
    })
    .partial()
    .optional(),
});

export const EngineFindParamsSchema = BaseFindParams.extend({
  filters: z
    .object({
      fuel: createOperatorMap(FuelTypeSchema).optional(),
      type: createOperatorMap(EngineTypeSchema).optional(),
      size: createOperatorMap(z.string()).optional(),
      tech: createOperatorMap(z.string()).optional(),
    })
    .optional(),
});

export const ModelFindParamsSchema = BaseFindParams.extend({
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

export const MakeFindParamsSchema = BaseFindParams.extend({
  filters: z
    .object({
      name: createOperatorMap(z.string()).optional(),
      models: z
        .object({
          name: createOperatorMap(z.string()).optional(),
          fitments: z
            .object({
              year_start: createOperatorMap(z.coerce.number()).optional(),
              year_end: createOperatorMap(z.coerce.number()).optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

export const ProductOptionValueFilterSchema = z.object({
  option_id: z.string(),
  value: z.string(),
});
export type ProductOptionValueFilter = z.infer<
  typeof ProductOptionValueFilterSchema
>;

export const ProductV2FindParams = BaseFindParams.extend({
  currency_code: z.string(),
  region_id: z.string(),
  q: z.string().optional(),
  fitment_id: z.string().optional(),
  category_id: z.string().optional(),
  sort: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  status: z
    .union([
      z.enum(["in_stock", "on_sale"]),
      z.array(z.enum(["in_stock", "on_sale"])),
    ])
    .optional(),
  option_values: z
    .union([
      z.array(ProductOptionValueFilterSchema),
      ProductOptionValueFilterSchema.transform((v) => [v]),
    ])
    .optional(),
});

export const ProductSearchParams = BaseFindParams.extend({
  q: z.string().min(1),
  currency_code: z.string(),
  region_id: z.string(),
  fitment_id: z.string().optional(),
});

/**
 * Query params for GET /store/products/v2/related
 * The backend resolves the product's category and returns same-category products,
 * excluding the source product itself.
 */
export const ProductRelatedFindParams = BaseFindParams.extend({
  product_id: z.string(),
  currency_code: z.string(),
  region_id: z.string(),
  fitment_id: z.string().optional(),
});
export type ProductRelatedFindParams = z.infer<typeof ProductRelatedFindParams>;
