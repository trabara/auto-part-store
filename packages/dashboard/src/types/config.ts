import { z } from "@medusajs/framework/zod";
import {
  BaseFieldConfig,
  FieldOverrides,
} from "@snowpact/react-rhf-zod-form/src/types";
import { CellContext, ColumnDefTemplate } from "@tanstack/react-table";
import { Entity } from "./data";
import { PageResponse, QueryFn } from "./query";

export interface StepConfig<S extends z.ZodTypeAny> {
  description?: string;
  header?: boolean;
  icon: React.ReactNode;
  id: string;
  label: string;
  schema: S;
};

export interface ActionConfig<S extends z.ZodTypeAny> {
  fields?: FieldOverrides<z.infer<S>>;
  schema: S;
};

export interface ListConfig<
  S extends z.ZodTypeAny,
  R extends PageResponse<z.infer<S>>,
> extends ActionConfig<S> {
  name: string;
  queryFn: QueryFn<z.infer<S>, R>;
};

export interface CreateConfig<S extends z.ZodTypeAny> extends ActionConfig<S> {
  mutateFn: (data: z.infer<S>) => Promise<any>;
  steps?: StepConfig<any>[];
};

export interface EditConfig<S extends z.ZodTypeAny> extends ActionConfig<S> {
  mutateFn: (id: string, data: z.infer<S>) => Promise<any>;
};

export interface CellOverride<
  T = unknown,
  TValue = unknown,
> extends BaseFieldConfig {
  cell: ColumnDefTemplate<CellContext<T, TValue>>;
}

export type CellOverrides<T> = {
  [K in keyof T]?: CellOverride<T, T[K]>;
};

export type MedusaFieldOverrides<T extends Entity> = FieldOverrides<T> | CellOverrides<T>;