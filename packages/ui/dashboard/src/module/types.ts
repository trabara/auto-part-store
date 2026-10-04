import { z } from "@medusajs/framework/zod";
import { UseDataTableReturn } from "@medusajs/ui";
import { CellContext, ColumnDefTemplate } from "@tanstack/react-table";
import { ComponentType, ReactNode } from "react";
import { TranslationFunction } from "../form/registry";
import { BaseFieldConfig, FieldOverrides } from "../form/types";

declare module "@medusajs/admin-sdk" {
  interface RouteConfig {
    /** Expands a dynamic route ([param]) into one sidebar item per entry. */
    items?: Array<{
      param: string;
      label: string;
      icon?: ComponentType;
      rank?: number;
      translationNs?: string;
    }>;
  }
}

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

export interface FilterFieldOverride extends BaseFieldConfig {
  isFiltrable?: boolean;
}

export type FilterFieldOverrides<T> = {
  [K in keyof T]?: FilterFieldOverride;
};

export type FeatureFieldOverrides<T> = FieldOverrides<T> &
  Partial<CellOverrides<T>> &
  Partial<FilterFieldOverrides<T>>;

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
  onClick?: (e: React.MouseEvent, row: T) => void;
  render?: (row: T) => React.ReactNode;
}

export interface StepConfig<T = {}> {
  id: string;
  description?: string;
  header?: boolean;
  icon?: React.ReactNode;
  display?: "default" | "full";
  label: string;
  schema: z.ZodType<T>;
}

export interface ActionConfig<T> {
  id: string;
  title?: string;
  description?: string;
  fields?: FeatureFieldOverrides<T>;
  schema: z.ZodType<T>;
}


export type ModuleRouter = {
  label: string;
  items: {
    param: string;
    label: string;
  }[];
};
