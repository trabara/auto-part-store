import { z } from "@medusajs/framework/zod";
import { UseDataTableReturn } from "@medusajs/ui";
import { CellContext, ColumnDefTemplate } from "@tanstack/react-table";
import { FieldValues } from "react-hook-form";
import { TranslationFunction } from "../form/registry";
import { BaseFieldConfig, FieldOverrides } from "../form/types";

export type Entity<T = {}> = T & { id: string };

/**
 * Parameters passed to the query function
 */
export interface PageQueryParams {
  limit: number;
  offset: number;
  fields?: string;
  order?: string;
  q?: string;
  filters?: Record<string, any>;
  search?: string;
}

/**
 * Type definition for the query function used in paginated queries
 */
export type QueryFn<R> = (
  signal: AbortSignal,
  params: PageQueryParams,
) => Promise<R>;

/**
 * Type definition for the select function used to transform query data
 */
export type SelectFn<T, R> = (data: R | undefined) => {
  data: T[] | undefined;
  rowCount: number | undefined;
};

export interface CellOverride<
  T = unknown,
  TValue = unknown,
> extends BaseFieldConfig {
  cell?: ColumnDefTemplate<CellContext<T, TValue>>;
  enableSorting?: boolean;
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

export type FeatureFieldOverrides<T extends FieldValues> =
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
  onClick?: (e: React.MouseEvent, row: T) => void;
  render?: (row: T) => React.ReactNode;
}

export interface StepConfig<T extends FieldValues = FieldValues> {
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
  fields?: FeatureFieldOverrides<T>;
  schema: z.ZodType<T>;
}

export type PageConfig<T extends FieldValues = {}> = {
  path?: string;
  schema: z.ZodType<T>;
  getTitle: (data?: T) => string;
  getOverrides?: (t: TranslationFunction) => FeatureFieldOverrides<T>;
};

export type CreatePageConfig<T extends FieldValues = {}> = PageConfig<T> & {
  steps?: StepConfig<T>[];
};

export type FeatureConfig<T extends Entity = Entity> = {
  path: string;
  entity: z.ZodType<T>;
  pages: {
    details: PageConfig;
    list: PageConfig;
    create: CreatePageConfig;
    update: PageConfig;
  };
};

export type ModuleDef = {
  id: string;
  path: string;
  name: string;
  features: Record<string, FeatureConfig>;
};

export type ModuleRouter = {
  label: string;
  items: {
    param: string;
    label: string;
  }[];
};

export type ModuleType = {
  name: string;
  path: string;
  getFeatures: () => Record<string, FeatureConfig>;
  getFeature: (entity: string, t?: TranslationFunction) => FeatureConfig;
  getRouter: () => ModuleRouter;
  buildRelationOverrides: (
    entity: string,
    schema: z.ZodSchema,
  ) => FeatureFieldOverrides<any>;
};
