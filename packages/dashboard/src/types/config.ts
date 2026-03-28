import { z } from "@medusajs/framework/zod";
import {
  BaseFieldConfig,
  FieldOverrides,
} from "@snowpact/react-rhf-zod-form/src/types";
import { CellContext, ColumnDefTemplate } from "@tanstack/react-table";
import { PageResponse, QueryFn } from "./query";

export type StepConfig<S extends z.AnyZodObject> = {
  description?: string;
  header?: boolean;
  icon: React.ReactNode;
  id: string;
  label: string;
  schema: S;
};

export type ActionConfig<S extends z.AnyZodObject> = {
  name: string;
  fields: FieldOverrides<z.infer<S>>;
};

export type ListConfig<
  S extends z.AnyZodObject,
  R extends PageResponse<z.infer<S>>,
> = ActionConfig<S> & {
  queryFn: QueryFn<z.infer<S>, R>;
  schema: S;
};

export type CreateConfig<S extends z.AnyZodObject> = ActionConfig<S> & {
  mutateFn: <R>(data: z.infer<S>) => Promise<R>;
  schema?: S;
  steps: StepConfig<S>[];
};

export type EditConfig<S extends z.AnyZodObject> = ActionConfig<S> & {
  mutateFn: <R>(data: z.infer<S>) => Promise<R>;
  schema: S;
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
