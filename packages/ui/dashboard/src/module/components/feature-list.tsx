import { z } from "@medusajs/framework/zod";
import {
  InformationCircle,
  MagnifyingGlass,
  PencilSquare,
  Trash,
} from "@medusajs/icons";
import { Container, UseDataTableReturn } from "@medusajs/ui";
import { zodQueryResolve } from "@repo/utils";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSdk } from "../../common/context";
import { DataTable } from "../components/data-table";
import { useModule } from "../context/module";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import {
  PageConfig,
  PageQueryParams,
  RowAction,
  SelectFn,
  ToolbarAction,
} from "../types";

type ListFeatureProps<T extends { id: string }> = {
  entity: string;
  config: PageConfig<T>;
};

const ListFeature = function List<
  T extends { id: string },
  R extends { data: []; metadata: { count: number } },
>({ config, entity, ...restProps }: ListFeatureProps<T>) {
  const sdk = useSdk();
  const navigate = useNavigate();

  const { t } = useTranslation();
  const module = useModule();

  const queryFields = useMemo(
    () => zodQueryResolve(config.schema),
    [config.schema],
  );

  const listAction = (signal: AbortSignal, params?: PageQueryParams) =>
    sdk.client.fetch<R>(`/admin${module.path}/${entity}`, {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: queryFields,
      },
    });

  const deleteMutation = useDeleteMutation({
    invalidateKeys: [module.path],
    errorMessage: t("common.error_delete_item"),
    successMessage: t("common.success_delete_item"),
    deleteFn: (id: string) =>
      sdk.client.fetch(`/admin${module.path}/${entity}/${id}`, {
        method: "DELETE",
      }),
  });

  const handleBulkDelete = async (table: UseDataTableReturn<T>) => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original);
    const selectedIds = selectedRows.map((row) => row.id);
    await deleteMutation.mutateAsync(...selectedIds);
  };

  const defaultRowActions: RowAction<T>[] = [
    {
      id: "edit",
      label: t("common.edit"),
      icon: <PencilSquare />,
      onClick: (e, row) => {
        e.stopPropagation();
        navigate(`${module.path}/${entity}/${row.id}/edit`);
      },
    },
    {
      id: "delete",
      label: t("common.delete"),
      icon: <Trash />,
      variant: "danger",
      onClick: (e, row) => {
        e.stopPropagation();
        deleteMutation.mutateAsync(row.id);
      },
    },
  ];

  const defaultToolbarActions: ToolbarAction<T>[] = [
    {
      id: "delete",
      icon: <Trash />,
      variant: "danger",
      label: t("common.delete"),
      onClick: (table) => handleBulkDelete(table),
    },
  ];

  const handleDataSelect: SelectFn<T, R> = (resp) => {
    return {
      data: z.array(config.schema).parse(resp?.data || []) as T[],
      rowCount: resp?.metadata.count ?? 0,
    };
  };

  const handleRowClick = (
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
    row: T,
  ) => {
    navigate(`${module.path}/${entity}/${row.id}`);
  };

  const title = config.getTitle();
  const overrideColumns =
    (typeof config.fields === "function" ? config.fields(t) : config.fields) ||
    {};

  return (
    <Container className="divide-y p-0">
      <DataTable<T, R>
        id={module.name}
        schema={config.schema}
        emptyState={{
          filtered: {
            custom: (
              <div className="flex flex-col items-center gap-y-3">
                <MagnifyingGlass />
                <div className="flex flex-col items-center gap-y-1">
                  <p className="font-medium font-sans txt-compact-small">
                    Aucun résultat
                  </p>
                  <p className="font-normal font-sans txt-small text-ui-fg-muted">
                    Aucun enregistrement ne correspond à vos filtres.
                  </p>
                </div>
              </div>
            ),
          },
          empty: {
            custom: (
              <div className="flex flex-col items-center gap-y-3">
                <InformationCircle />
                <div className="flex flex-col items-center gap-y-1">
                  <p className="font-medium font-sans txt-compact-small">
                    Aucun enregistrement
                  </p>
                  <p className="font-normal font-sans txt-small text-ui-fg-muted">
                    Vos {entity}s apparaîtront ici.
                  </p>
                </div>
              </div>
            ),
          },
        }}
        title={title}
        overrides={overrideColumns}
        queryFn={listAction}
        selectFn={handleDataSelect}
        onRowClick={handleRowClick}
        onCreateClicked={() => navigate(`${module.path}/${entity}/create`)}
        actionState={{
          row: [...defaultRowActions],
          toolbar: [...defaultToolbarActions],
        }}
        {...restProps}
      />
    </Container>
  );
};

export default ListFeature;
