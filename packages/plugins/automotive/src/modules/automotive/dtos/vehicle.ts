import * as z from "@medusajs/framework/zod";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
import {
  EngineTypeSchema,
  FuelTypeSchema,
  VehicleEngineSchema,
  VehicleMakeSchema,
  VehicleModelSchema,
  VehicleSchema,
} from "../schemas/vehicle";
import { BASE_MASK } from "@repo/core/framework";

// ── Create input schemas ──────────────────────────────────────────────────────

export const CreateMakeInputSchema = VehicleMakeSchema.omit({
  ...BASE_MASK,
  models: true,
});
export type CreateMakeInput = z.infer<typeof CreateMakeInputSchema>;

export const CreateModelInputSchema = VehicleModelSchema.omit({
  ...BASE_MASK,
  make: true,
  vehicles: true,
}).extend({ make_id: z.string() });
export type CreateModelInput = z.infer<typeof CreateModelInputSchema>;

export const CreateEngineInputSchema = VehicleEngineSchema.omit({
  ...BASE_MASK,
  vehicles: true,
});
export type CreateEngineInput = z.infer<typeof CreateEngineInputSchema>;

export const CreateVehicleInputSchema = VehicleSchema.omit({
  ...BASE_MASK,
  model: true,
  engine: true,
}).extend({
  model_id: z.string(),
  engine_id: z.string(),
  // product_id: z.string().optional(),
});
export type CreateVehicleInput = z.infer<typeof CreateVehicleInputSchema>;

// ── Update input schemas ──────────────────────────────────────────────────────

export const UpdateMakeInputSchema = CreateMakeInputSchema.partial().extend({
  id: z.string(),
});
export type UpdateMakeInput = z.infer<typeof UpdateMakeInputSchema>;

export const UpdateMakeBatchInputSchema = z.object({
  makes: z.array(UpdateMakeInputSchema.extend({ id: z.string() })),
});
export type UpdateMakeBatchInput = z.infer<typeof UpdateMakeBatchInputSchema>;

export const UpdateModelInputSchema = CreateModelInputSchema.partial().extend({
  id: z.string(),
});
export type UpdateModelInput = z.infer<typeof UpdateModelInputSchema>;

export const UpdateModelBatchInputSchema = z.object({
  models: z.array(UpdateModelInputSchema),
});
export type UpdateModelBatchInput = z.infer<typeof UpdateModelBatchInputSchema>;

export const UpdateEngineInputSchema = CreateEngineInputSchema.extend({
  id: z.string(),
}).partial();

export type UpdateEngineInput = z.infer<typeof UpdateEngineInputSchema>;

export const UpdateEngineBatchInputSchema = z.object({
  entities: z.array(UpdateEngineInputSchema),
});

export type UpdateEngineBatchInput = z.infer<
  typeof UpdateEngineBatchInputSchema
>;

export const UpdateVehicleInputSchema = VehicleSchema.omit(BASE_MASK)
  .omit({ model: true, engine: true })
  .partial()
  .extend({
    id: z.string(),
    model_id: z.string(),
    engine_id: z.string(),
  });
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleInputSchema>;

// ── Link schemas ──────────────────────────────────────────────────────────────

export const LinkProductsInputSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, "At least one product ID is required"),
});
export type LinkProductsInput = z.infer<typeof LinkProductsInputSchema>;

export const LinkFitmentsInputSchema = z.object({
  fitment_ids: z
    .array(z.string())
    .min(1, "At least one fitment ID is required"),
});
export type LinkFitmentsInput = z.infer<typeof LinkFitmentsInputSchema>;

// ── Find param schemas ────────────────────────────────────────────────────────

const BaseFindParams = createFindParams();

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

export type ProductV2FindParams = z.infer<typeof ProductV2FindParams>;

export const ProductSearchParams = BaseFindParams.extend({
  q: z.string().min(1),
  currency_code: z.string(),
  region_id: z.string(),
  fitment_id: z.string().optional(),
});

export type ProductSearchParams = z.infer<typeof ProductSearchParams>;

export const ProductRelatedFindParams = BaseFindParams.extend({
  product_id: z.string(),
  currency_code: z.string(),
  region_id: z.string(),
  fitment_id: z.string().optional(),
});
export type ProductRelatedFindParams = z.infer<typeof ProductRelatedFindParams>;
