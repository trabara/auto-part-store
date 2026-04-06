import * as z from "@medusajs/framework/zod";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
import { BASE_MASK } from "../schemas/base";
import {
  FuelTypeSchema,
  EngineTypeSchema,
  FitmentSchema,
  EngineSchema,
  MakeSchema,
} from "../schemas/fitment";

// ── Create input schemas ──────────────────────────────────────────────────────

export const CreateMakeInputSchema = MakeSchema.omit(BASE_MASK);
export const CreateModelInputSchema = z.object({
  name: z.string(),
  make_id: z.string(),
});
export const CreateEngineInputSchema = EngineSchema.omit(BASE_MASK);
export const CreateFitmentInputSchema = FitmentSchema.omit(BASE_MASK).extend({
  model_id: z.string(),
  engine_id: z.string(),
  product_id: z.string().optional(),
});

// ── Update input schemas ──────────────────────────────────────────────────────

export const UpdateMakeInputSchema = z.object({
  name: z.string().optional(),
});
export const UpdateModelInputSchema = z.object({
  name: z.string().optional(),
  make_id: z.string().optional(),
});
export const UpdateEngineInputSchema = z.object({
  fuel: FuelTypeSchema.optional(),
  type: EngineTypeSchema.optional(),
  size: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .optional(),
  tech: z.string().optional(),
});
export const UpdateFitmentInputSchema = FitmentSchema.omit(BASE_MASK)
  .partial()
  .extend({
    id: z.string(),
    model_id: z.string(),
    engine_id: z.string(),
  });

// ── Link schemas ──────────────────────────────────────────────────────────────

export const LinkProductsInputSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, "At least one product ID is required"),
});

export const LinkFitmentsInputSchema = z.object({
  fitment_ids: z
    .array(z.string())
    .min(1, "At least one fitment ID is required"),
});

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
