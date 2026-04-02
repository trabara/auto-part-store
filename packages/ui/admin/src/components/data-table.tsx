import { z } from "@medusajs/framework/zod";
import {
  Button,
  clx,
  DataTable as DataTableUI,
  Heading,
  Hint,
  IconButton,
  useDataTable
} from "@medusajs/ui";
import { Row } from '@tanstack/react-table';
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePageQuery } from "../hooks/use-page-query";
import { ListConfig } from "../types/config";
import { Entity } from "../types/data";
import { PageResponse, QueryFn } from "../types/query";
import { DataTableBulkActionsToolbar } from "./bulk-actions-toolbar";
import { createZodDataTableColumnDef } from "./data-table-columns";
import createZodDataTableFilterDef from "./data-table-filters";

interface DataTableListProps<
  S extends z.AnyZodObject,
  T extends Entity<z.infer<S>>,
> extends ListConfig<T> {
  className?: string;
  selectedIds?: string[];
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
    id,
    className,
    schema,
    title,
    description,
    fields = {},
    toolbarActions = [],
    rowActions = [],
    selectedIds = [],
    queryFn,
    onCreateClicked,
    onRowClick,
    onRowSelectChange,
  } = props;

  const { t } = useTranslation()
  const rowsRef = useRef<Row<T>[]>([]);

  const defaultRowsSelection = useMemo(
    () =>
      selectedIds.reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {} as Record<string, boolean>),
    []
  );

  const columns = useMemo(() =>
    createZodDataTableColumnDef({
      schema,
      fields,
      actions: rowActions,
    }),
    [
      schema,
      fields,
      rowActions
    ]);

  const filters = useMemo(() =>
    createZodDataTableFilterDef(schema, fields),
    [schema, fields]);

  const [queryConfig] = usePageQuery({
    queryKey: id,
    defaultRowsSelection,
    queryFn,
    selectFn: (resp: PageResponse<T> | undefined) => {
      return {
        data: resp?.data,
        rowCount: resp?.metadata?.count,
      };
    },
  });

  const table = useDataTable<T>({
    ...queryConfig,
    columns,
    filters,
    onRowClick: (_, row) =>
      onRowClick?.(row),
  });

  const rows = table.getRowModel().rows
  useEffect(() => {
    rowsRef.current = [...rowsRef.current, ...rows];
  }, [rows]);

  const rowSelection = Object.keys(table.getRowSelection())
    .map(id => rowsRef.current.find(r => r.id === id))
    .filter(Boolean) as unknown as T[];

  useEffect(() => {
    onRowSelectChange?.(rowSelection);
  }, [rowSelection, onRowSelectChange]);


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

      <DataTableUI.Table />
      <DataTableUI.Pagination />

      {toolbarActions.length > 0 && (
        <DataTableBulkActionsToolbar table={table} entityName={id}>
          {toolbarActions?.map((action) => (
            <IconButton
              key={action.id}
              size="large"
              className={clx("rounded-none", {
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