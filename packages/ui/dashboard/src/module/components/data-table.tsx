import {
  Button,
  clx,
  DataTable as DataTableUI,
  Heading,
  Hint,
  useDataTable,
} from "@medusajs/ui";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createZodDataTableColumnDef } from "../helpers/create-zod-columns";
import { createZodDataTableFilterDef } from "../helpers/create-zod-filters";
import { usePageQuery } from "../hooks/use-page-query";
import { FeaturePageConfig, QueryFn, SelectFn } from "../types";
import { DataTableBulkActionsToolbar } from "./bulk-actions-toolbar";

interface DataTableListProps<
  T extends { id: string },
  R,
> extends FeaturePageConfig {
  className?: string;
  selectedIds?: string[];
  queryFn: QueryFn<R>;
  selectFn?: SelectFn<T, R>;
  onCreateClicked?: () => void;
  onRowClick?: (
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
    row: T,
  ) => void;
  onRowSelectChange?: (rows: T[]) => void;
}

export const DataTable = <T extends { id: string }, R>(
  props: DataTableListProps<T, R>,
) => {
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
    selectFn,
    onCreateClicked,
    onRowClick,
    onRowSelectChange,
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
        fields,
        actions: rowActions,
      }),
    [schema, fields, rowActions],
  );

  const filters = useMemo(
    () => createZodDataTableFilterDef(schema, fields),
    [schema, fields],
  );

  const [queryConfig] = usePageQuery<T, R>({
    queryKey: id,
    defaultRowsSelection,
    queryFn,
    selectFn: (resp) => {
      if (selectFn) {
        return selectFn(resp);
      }

      return resp as { data: T[]; rowCount: number };
    },
  });

  const table = useDataTable({
    ...queryConfig,
    columns,
    filters,
    onRowClick,
  });

  const rows = table.getRowModel().rows;
  const rowSelection = Object.keys(table.getRowSelection())
    .map((id) => rows.find((r) => r.id === id)?.original as T)
    .filter((r) => r !== undefined);

  useEffect(() => {
    onRowSelectChange?.(rowSelection);
  }, [rowSelection, onRowSelectChange]);

  // if (!table.isLoading && table.rowCount === 0) {
  //   return (
  //     <div className="flex h-[150px] w-full flex-col items-center justify-center gap-y-4">
  //       <div className="flex flex-col items-center gap-y-3">
  //         <ExclamationCircle width="15" height="15" className="text-ui-fg-subtle" />
  //         <div className="flex flex-col items-center gap-y-1">
  //           <p className="font-medium font-sans txt-compact-small">No records</p>
  //           <p className="font-normal font-sans txt-small text-ui-fg-muted">
  //             There are no records to show
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

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
      {/* <DataTableUI.CommandBar selectedLabel={(count) => `${count} selected`} /> */}

      {toolbarActions.length > 0 && (
        <DataTableBulkActionsToolbar table={table} entityName={id}>
          {toolbarActions?.map((action) => {
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
