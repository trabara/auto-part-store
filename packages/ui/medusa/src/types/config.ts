import { z } from "@medusajs/framework/zod";
import { UseDataTableReturn } from "@medusajs/ui";
import { CellContext, ColumnDefTemplate } from "@tanstack/react-table";
import { FieldValues } from "react-hook-form";
import { BaseFieldConfig, FieldOverrides } from "./form";
import { TranslationFunction } from "../registry";

export interface CellOverride<
  T = unknown,
  TValue = unknown,
> extends BaseFieldConfig {
  cell?: ColumnDefTemplate<CellContext<T, TValue>>;
}

export type CellOverrides<T> = {
  [K in keyof T]?: CellOverride<T, T[K]>;
};

export interface FilterFieldOverride<
  T extends FieldValues,
  TValue = unknown,
> extends BaseFieldConfig {
  isFiltrable?: boolean;
}

export type FilterFieldOverrides<T extends FieldValues> = {
  [K in keyof T]?: FilterFieldOverride<T, T[K]>;
};

export type MedusaFieldOverrides<T extends FieldValues> =
  FieldOverrides<T> | CellOverrides<T> | FilterFieldOverrides<T>;

export interface BaseAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "danger" | "default";
}

export interface ToolbarAction<T extends FieldValues> extends BaseAction {
  onClick: (table: UseDataTableReturn<T>) => void;
}

export interface RowAction<T extends FieldValues> extends BaseAction {
  onClick?: (row: T) => void;
  render?: (row: T) => React.ReactNode;
}

export interface StepConfig<T extends FieldValues> {
  id: string;
  description?: string;
  header?: boolean;
  icon?: React.ReactNode;
  display?: "default" | "full";
  label: string;
  schema: z.ZodObject<T>;
}

export interface ActionConfig<T extends FieldValues> {
  id: string;
  title?: string;
  description?: string;
  fields?: MedusaFieldOverrides<T>;
  schema: z.ZodObject<T>;
}

export interface ListConfig<T extends FieldValues> extends ActionConfig<T> {
  toolbarActions?: ToolbarAction<T>[];
  rowActions?: RowAction<T>[];
}

export interface CreateConfig<T extends FieldValues> extends ActionConfig<T> {
  steps?: StepConfig<T>[];
}

export interface EditConfig<T extends FieldValues> extends ActionConfig<T> {}

export type EntityFieldConfigs<L extends FieldValues = {}> = (
  t: TranslationFunction,
) => MedusaFieldOverrides<L> | MedusaFieldOverrides<L>;

export type EntityFeature<S extends FieldValues = {}> = {
  getTitle: (data?: S) => string;
  schema: z.ZodObject<S>;
  fields?: EntityFieldConfigs<S>;
};

export type EntityConfig<
  D extends FieldValues = {},
  L extends FieldValues = {},
  C extends FieldValues = {},
  U extends FieldValues = {},
> = {
  entity: string;
  path: string;
  details: EntityFeature<D>;
  list: EntityFeature<L>;
  create: EntityFeature<C> & { steps?: StepConfig<C>[] };
  update: EntityFeature<U>;
};
