import { z } from "@medusajs/framework/zod";

export function TemplateDetail<S extends z.ZodTypeAny>() {
  // const navigate = useNavigate();
  // const { t } = useTranslation();
  // const sdk = useSdk();

  // const module = useModule(initialData);

  // const title = config.getDisplayTitle(initialData);

  // const attributes = useMemo(
  //   () => classifyAttributes(module, entity, config.schema, initialData),
  //   [module, entity, config.schema, initialData],
  // );

  // const deleteMutation = useDeleteMutation({
  //   invalidateKeys: [module.path, entity],
  //   errorMessage: t("common.error_delete_item"),
  //   successMessage: t("common.success_delete_item"),
  //   deleteFn: async (id: string) => {
  //     await sdk.client.fetch(`/admin${module.path}/${entity}/${id}`, {
  //       method: "DELETE",
  //     });
  //     navigate(module.path);
  //   },
  // });

  // const mainSections = useMemo(
  //   () => [
  //     <DetailsSection
  //       key="__general"
  //       title={title}
  //       attributes={attributes.scalar}
  //       actions={[
  //         {
  //           id: "edit",
  //           label: t("common.edit"),
  //           icon: <Pencil />,
  //           onClick: () =>
  //             navigate(`${module.path}/${entity}/${initialData.id}/edit`),
  //         },
  //         {
  //           id: "delete",
  //           label: t("common.delete"),
  //           icon: <Trash />,
  //           onClick: () => deleteMutation.mutateAsync(initialData.id),
  //         },
  //       ]}
  //     />,
  //     ...attributes.many.map(({ key, schema, value }) => {
  //       const parentId = initialData?.id;
  //       const parentFilterKey = `${entity}_id`;
  //       return (
  //         <Container key={key} className="divide-y p-0">
  //           <DataTable
  //             id={key}
  //             title={_.startCase(key)}
  //             schema={schema as unknown as z.ZodType<T>}
  //             overrides={{}}
  //             queryFn={(signal, params) => {
  //               const query: Record<string, unknown> = {
  //                 ...params,
  //                 fields: zodQueryResolve(schema),
  //               };
  //               if (parentId) {
  //                 query[parentFilterKey] = parentId;
  //               }
  //               return sdk.client.fetch<{
  //                 data: T[];
  //                 metadata: { count: number };
  //               }>(`/admin${module.path}/${key}`, {
  //                 signal,
  //                 query,
  //               });
  //             }}
  //           />
  //         </Container>
  //       );
  //     }),
  //   ],
  //   [attributes, title, initialData, entity],
  // );

  // const sideSections = useMemo(() => {
  //   return attributes.one.map(({ key, value, schema }) => {
  //     const entries = Object.entries(value ?? {}).filter(([, v]) => v != null);
  //     return (
  //       <DetailsSection
  //         key={key}
  //         title={_.startCase(key)}
  //         attributes={entries.map(([k, v]) => ({
  //           key: k,
  //           value: v != null ? String(v) : "—",
  //           schema: z.any(),
  //         }))}
  //       />
  //     );
  //   });
  // }, [attributes.one]);

  // const preferredLayoutId =
  //   mainSections.length > 0 && sideSections.length > 0
  //     ? "core:two-column"
  //     : "core:single-column";

  return (
    <>
      {/* <LayoutComposer
        data={initialData}
        widgetsZonePrefix={`${entity}.details`}
        preferredLayoutId={preferredLayoutId}
        sections={{
          main: mainSections,
          side: sideSections,
        }}
      /> */}
    </>
  );
}
