import { z } from "@medusajs/framework/zod";
import { UseDataTableReturn } from "@medusajs/ui";
import {
  BaseFieldConfig,
  FieldOverrides,
} from "@snowpact/react-rhf-zod-form/src/types";
import { CellContext, ColumnDefTemplate } from "@tanstack/react-table";
import { Entity } from "./data";

export interface BaseAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "danger" | "default";
}

export interface ToolbarAction<T> extends BaseAction {
  onClick: (table: UseDataTableReturn<T>) => void;
}


export interface RowAction<T> extends BaseAction {
  onClick?: (row: T) => void;
  render?: (row: T) => React.ReactNode;
}

export interface StepConfig<S extends z.ZodTypeAny> {
  description?: string;
  header?: boolean;
  icon?: React.ReactNode;
  id: string;
  label: string;
  schema: S;
};

export interface ActionConfig<T extends {}> {
  id: string
  title?: string;
  description?: string;
  fields?: MedusaFieldOverrides<T>;
  schema: z.AnyZodObject;
};

export interface ListConfig<
  T extends Entity
> extends ActionConfig<T> {
  toolbarActions?: ToolbarAction<T>[];
  rowActions?: RowAction<T>[];
};

export interface CreateConfig<T extends {}> extends ActionConfig<T> {
  steps?: StepConfig<any>[];
};

export interface EditConfig<T extends {}> extends ActionConfig<T> {
};

export interface CellOverride<
  T = unknown,
  TValue = unknown,
> extends BaseFieldConfig {
  cell?: ColumnDefTemplate<CellContext<T, TValue>>;
}

export type CellOverrides<T> = {
  [K in keyof T]?: CellOverride<T, T[K]>;
};

export type MedusaFieldOverrides<T extends {}> = FieldOverrides<T> | CellOverrides<T>;