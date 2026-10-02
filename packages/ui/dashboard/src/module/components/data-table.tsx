import { z } from "@medusajs/framework/zod";
import {
  Button,
  clx,
  DataTableEmptyStateProps,
  DataTable as DataTableUI,
  Heading,
  Hint,
  useDataTable,
} from "@medusajs/ui";
import { useMemo } from "react";
import { FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createZodDataTableColumnDef } from "../helpers/create-zod-columns";
import { createZodDataTableFilterDef } from "../helpers/create-zod-filters";
import { usePageQuery } from "../hooks/use-page-query";
import {
  FeatureFieldOverrides,
  QueryFn,
  RowAction,
  SelectFn,
  ToolbarAction,
} from "../types";
import { DataTableBulkActionsToolbar } from "./bulk-actions-toolbar";

type ActionStateProps<T extends FieldValues> = {
  row: RowAction<T>[];
  toolbar: ToolbarAction<T>[];
};

interface DataTableListProps<
  T extends { id: string },
  R extends { data: T[]; metadata: { count: number } },
> {
  id: string;
  title?: string;
  description?: string;
  schema: z.ZodType<T>;
  className?: string;
  emptyState?: DataTableEmptyStateProps;
  actionState?: ActionStateProps<T>;
  selectedIds?: string[];
  overrides: FeatureFieldOverrides<T>;
  queryFn: QueryFn<R>;
  selectFn?: SelectFn<T, R>;
  onCreateClicked?: () => void;
  onRowClick?: (
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
    row: T,
  ) => void;
  onRowSelectChange?: (rows: T[]) => void;
}

export const DataTable = <
  T extends { id: string },
  R extends { data: T[]; metadata: { count: number } } = {
    data: T[];
    metadata: { count: number };
  },
>(
  props: DataTableListProps<T, R>,
) => {
  const {
    id,
    className,
    schema,
    title,
    description,
    emptyState,
    overrides = {},
    actionState = { toolbar: [], row: [] },
    selectedIds = [],
    queryFn,
    selectFn,
    onCreateClicked,
    onRowClick,
  } = props;

  const { t } = useTranslation();

  const defaultRowsSelection = useMemo(
    () =>
      selectedIds.reduce(
        (acc, id) => {
          acc[id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    [selectedIds],
  );

  const columns = useMemo(
    () =>
      createZodDataTableColumnDef({
        schema,
        overrides,
        actions: actionState.row,
      }),
    [schema, overrides, actionState.row],
  );

  const filters = useMemo(
    () => createZodDataTableFilterDef<T>(schema, overrides),
    [schema, overrides],
  );

  const [queryConfig] = usePageQuery<T, R>({
    queryKey: id,
    defaultRowsSelection,
    queryFn,
    selectFn: (resp) => {
      if (selectFn) {
        return selectFn(resp);
      }

      return resp as unknown as { data: T[]; rowCount: number };
    },
  });

  const table = useDataTable<T>({
    ...queryConfig,
    columns,
    filters,
    onRowClick,
  });

  return (
    <DataTableUI instance={table} className={className}>
      <DataTableUI.Toolbar className="flex items-center justify-between px-6 py-4">
        <div>
          {title && (
            <Heading level="h1">
              <span className="capitalize">{title}</span>
            </Heading>
          )}
          {description && <Hint>{description}</Hint>}
        </div>
        <div className="flex items-center gap-x-2">
          {onCreateClicked && (
            <Button variant="secondary" size="small" onClick={onCreateClicked}>
              {t("common.create")}
            </Button>
          )}
        </div>
      </DataTableUI.Toolbar>

      <DataTableUI.Table emptyState={emptyState} />
      <DataTableUI.Pagination />

      {actionState.toolbar.length > 0 && (
        <DataTableBulkActionsToolbar table={table} entityName={id}>
          {actionState.toolbar?.map((action) => {
            return (
              <Button
                key={action.id}
                size="large"
                className={clx("rounded-none text-xs", {
                  "text-ui-fg-error hover:bg-ui-error/10 data-[state=active]:bg-ui-error/20":
                    action.variant === "danger",
                  "text-ui-fg-default hover:bg-ui-default/10 data-[state=active]:bg-ui-default/20":
                    !action.variant,
                })}
                variant="transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(table);
                }}
              >
                {action.icon}
                {action.label}
              </Button>
            );
          })}
        </DataTableBulkActionsToolbar>
      )}
    </DataTableUI>
  );
};
