import type * as z from "@medusajs/framework/zod";
import type {
  FuelTypeSchema,
  DriveTypeSchema,
  TransmissionTypeSchema,
  BodyStyleTypeSchema,
  EngineTypeSchema,
  MakeSchema,
  ModelSchema,
  EngineSchema,
  FitmentSchema,
} from "../schemas/fitment";

export type FuelType = z.infer<typeof FuelTypeSchema>;
export type DriveType = z.infer<typeof DriveTypeSchema>;
export type TransmissionType = z.infer<typeof TransmissionTypeSchema>;
export type BodyStyleType = z.infer<typeof BodyStyleTypeSchema>;
export type EngineType = z.infer<typeof EngineTypeSchema>;

export type Make = z.infer<typeof MakeSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type Engine = z.infer<typeof EngineSchema>;
export type Fitment = z.infer<typeof FitmentSchema>;

// ── Create input types ────────────────────────────────────────────────────────

export type CreateMakeInput = {
  name: string;
};

export type CreateModelInput = {
  name: string;
  make_id: string;
};

export type CreateEngineInput = {
  fuel?: FuelType;
  type?: EngineType;
  size?: string;
  tech?: string;
};

export type CreateFitmentInput = {
  body_style?: BodyStyleType;
  doors?: number;
  drive?: DriveType;
  transmission?: TransmissionType;
  year_start: number;
  year_end?: number;
  model_id: string;
  engine_id: string;
  product_id?: string;
};

// ── Update input types ────────────────────────────────────────────────────────

export type UpdateMakeInput = {
  name?: string;
};

export type UpdateModelInput = {
  name?: string;
  make_id?: string;
};

export type UpdateEngineInput = {
  fuel?: FuelType;
  type?: EngineType;
  size?: string;
  tech?: string;
};

export type UpdateFitmentInput = {
  id: string;
  model_id: string;
  engine_id: string;
  body_style?: BodyStyleType;
  doors?: number;
  drive?: DriveType;
  transmission?: TransmissionType;
  year_start?: number;
  year_end?: number;
};
