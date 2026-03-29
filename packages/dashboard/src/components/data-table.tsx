import { z } from "@medusajs/framework/zod";
import {
  Button,
  DataTableColumnDef,
  DataTableFilter,
  DataTable as DataTableUI,
  Heading,
  Hint,
  IconButton,
  useDataTable
} from "@medusajs/ui";
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createZodDataTableColumnDef } from "./data-table-columns";
import { usePageQuery } from "../hooks/use-page-query";
import { ListConfig } from "../types/config";
import { Entity } from "../types/data";
import { PageResponse, QueryFn } from "../types/query";
import { DataTableBulkActionsToolbar } from "./bulk-actions-toolbar";

interface DataTableListProps<
  S extends z.AnyZodObject,
  T extends Entity<z.infer<S>>,
> extends ListConfig<T> {
  className?: string;
  queryFn: QueryFn<PageResponse<T>>;
  onCreateClicked?: () => void;
  onRowClick?: (row: T) => void;
  onRowSelectChange?: (rows: T[]) => void;
}

const DataTable = <
  S extends z.AnyZodObject,
  T extends Entity<z.infer<S>>,
>(props: DataTableListProps<S, T>) => {
  const {
    name,
    className,
    schema,
    description,
    fields = {},
    toolbarActions = [],
    rowActions = [],
    queryFn,
    onCreateClicked,
    onRowClick,
    onRowSelectChange,
  } = props;

  const { t } = useTranslation()

  const queryConfig = usePageQuery({
    queryKey: name,
    queryFn,
    selectFn: (resp: PageResponse<T> | undefined) => {
      return {
        data: resp?.data,
        rowCount: resp?.metadata?.count,
      };
    },
  });

  const columns = useMemo(() =>
    createZodDataTableColumnDef({
      schema,
      fields,
      actions: rowActions,
    }) as DataTableColumnDef<T, any>[], []);

  const filters = useMemo((): DataTableFilter[] => {
    return [];
  }, []);

  const table = useDataTable<T>({
    ...queryConfig,
    columns,
    filters,
    onRowClick: (_, row) =>
      onRowClick?.(row)
  });

  useEffect(() => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original);
    onRowSelectChange?.(selectedRows);
  }, [table, onRowSelectChange]);

  return (
    <DataTableUI instance={table} className={className}>
      <DataTableUI.Toolbar className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">
            <span className="capitalize">{name}</span>
          </Heading>
          {description && <Hint>{description}</Hint>}
        </div>
        {onCreateClicked && (
          <Button variant="secondary" size="small" onClick={onCreateClicked}>
            {t("common.create")}
          </Button>
        )}
      </DataTableUI.Toolbar>

      <DataTableUI.Table />
      <DataTableUI.Pagination />

      {toolbarActions.length > 0 && (
        <DataTableBulkActionsToolbar table={table} entityName={name}>
          {toolbarActions?.map((action) => (
            <IconButton
              key={action.id}
              size="large"
              className={cn("rounded-none", {
                "text-ui-fg-error hover:bg-ui-error/10 data-[state=active]:bg-ui-error/20": action.variant === "danger",
              })}
              variant="transparent"
              onClick={() => action.onClick(table)}
            >
              {action.icon}
            </IconButton>
          ))}
        </DataTableBulkActionsToolbar>
      )}
    </DataTableUI >
  );
};

export default DataTable;
