import { z } from "@medusajs/framework/zod";

export function TemplateList<
  S extends z.ZodTypeAny,
  DTO extends z.infer<S> & { id: string },
  R extends { data: DTO[]; metadata: { count: number } },
>() {
  // const sdk = useSdk();
  // const navigate = useNavigate();
  // const { t } = useTranslation();
  // const module = useModule();
  // const deleteMutation = useDeleteMutation({
  //   invalidateKeys: [config.path],
  //   errorMessage: t("common.error_delete_item"),
  //   successMessage: t("common.success_delete_item"),
  //   deleteFn: (id: string) =>
  //     sdk.client.fetch(`/admin${config.path}/${id}`, {
  //       method: "DELETE",
  //     }),
  // });
  // const handleBulkDelete = async (table: UseDataTableReturn<DTO>) => {
  //   const selectedRows = table
  //     .getRowModel()
  //     .rows.filter((row) => row.getIsSelected())
  //     .map((row) => row.original);
  //   const selectedIds = selectedRows.map((row) => row.id);
  //   await deleteMutation.mutateAsync(...selectedIds);
  // };
  // const defaultRowActions: RowAction<DTO>[] = [
  //   {
  //     id: "edit",
  //     label: t("common.edit"),
  //     icon: <PencilSquare />,
  //     onClick: (e, row) => {
  //       e.stopPropagation();
  //       navigate(`${config.path}/${row.id}/edit`);
  //     },
  //   },
  //   {
  //     id: "delete",
  //     label: t("common.delete"),
  //     icon: <Trash />,
  //     variant: "danger",
  //     onClick: (e, row) => {
  //       e.stopPropagation();
  //       deleteMutation.mutateAsync(row.id);
  //     },
  //   },
  // ];
  // const defaultToolbarActions: ToolbarAction<DTO>[] = [
  //   {
  //     id: "delete",
  //     icon: <Trash />,
  //     variant: "danger",
  //     label: t("common.delete"),
  //     onClick: (table) => handleBulkDelete(table),
  //   },
  // ];
  // const handleDataSelect: SelectFn<DTO, R> = (resp) => {
  //   return {
  //     data: z.array(config.dto).parse(resp?.data || []) as DTO[],
  //     rowCount: resp?.metadata.count ?? 0,
  //   };
  // };
  // const handleRowClick = (
  //   e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
  //   row: DTO,
  // ) => {
  //   navigate(`${config.path}/${row.id}`);
  // };
  // const title = config.getDisplayTitle();
  // const overrideColumns = config.getOverrides?.(t) || {};
  // const queryFields = useMemo(() => zodQueryResolve(config.dto), [config.dto]);
  // return (
  //   <Container className="divide-y p-0">
  //     <DataTable
  //       id={module.name}
  //       schema={config.dto as any}
  //       emptyState={{
  //         filtered: {
  //           custom: (
  //             <div className="flex flex-col items-center gap-y-3">
  //               <MagnifyingGlass />
  //               <div className="flex flex-col items-center gap-y-1">
  //                 <p className="font-medium font-sans txt-compact-small">
  //                   Aucun résultat
  //                 </p>
  //                 <p className="font-normal font-sans txt-small text-ui-fg-muted">
  //                   Aucun enregistrement ne correspond à vos filtres.
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //         },
  //         empty: {
  //           custom: (
  //             <div className="flex flex-col items-center gap-y-3">
  //               <InformationCircle />
  //               <div className="flex flex-col items-center gap-y-1">
  //                 <p className="font-medium font-sans txt-compact-small">
  //                   Aucun enregistrement
  //                 </p>
  //                 <p className="font-normal font-sans txt-small text-ui-fg-muted">
  //                   Vos {config.getDisplayTitle()}s apparaîtront ici.
  //                 </p>
  //               </div>
  //             </div>
  //           ),
  //         },
  //       }}
  //       title={title}
  //       overrides={overrideColumns}
  //       queryFn={(signal, params) =>
  //         sdk.client.fetch<R>(`/admin${config.path}`, {
  //           method: "GET",
  //           signal,
  //           query: {
  //             ...(params || {}),
  //             fields: queryFields,
  //           },
  //         })
  //       }
  //       selectFn={handleDataSelect}
  //       onRowClick={handleRowClick}
  //       onCreateClicked={() => navigate(`${config.path}/create`)}
  //       actionState={{
  //         row: [...defaultRowActions],
  //         toolbar: [...defaultToolbarActions],
  //       }}
  //     />
  //   </Container>
  // );
}
