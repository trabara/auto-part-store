import { z } from "@medusajs/framework/zod";
import {
  BaseFieldConfig,
  FieldOverrides,
} from "@snowpact/react-rhf-zod-form/src/types";
import { CellContext, ColumnDefTemplate } from "@tanstack/react-table";
import { PageResponse, QueryFn } from "./query";

export interface StepConfig<S extends z.AnyZodObject> {
  description?: string;
  header?: boolean;
  icon: React.ReactNode;
  id: string;
  label: string;
  schema: S;
};

export interface ActionConfig<S extends z.AnyZodObject> {
  fields?: FieldOverrides<z.infer<S>>;
  schema: S;
};

export interface ListConfig<
  S extends z.AnyZodObject,
  R extends PageResponse<z.infer<S>>,
> extends ActionConfig<S> {
  name: string;
  queryFn: QueryFn<z.infer<S>, R>;
};

export interface CreateConfig<S extends z.AnyZodObject> extends ActionConfig<S> {
  mutateFn: (data: z.infer<S>) => Promise<any>;
  steps?: StepConfig<any>[];
};

export interface EditConfig<S extends z.AnyZodObject> extends ActionConfig<S> {
  mutateFn: (data: z.infer<S>) => Promise<any>;
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
