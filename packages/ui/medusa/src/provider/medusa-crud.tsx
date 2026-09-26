import { z } from "@medusajs/framework/zod";
import { PencilSquare, Trash } from "@medusajs/icons";
import type Medusa from "@medusajs/js-sdk";
import {
  Button,
  Container,
  DatePicker,
  Drawer,
  FocusModal,
  Heading,
  Hint,
  Input,
  Label,
  ProgressTabs,
  Select,
  Switch,
  Textarea,
  UseDataTableReturn,
} from "@medusajs/ui";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { DataTable } from "../components/data-table";
import { Form } from "../components/form";
import { useCreateMutation } from "../hooks/use-create-mutation";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import { useUpdateMutation } from "../hooks/use-update-mutation";
import { useWizardForm } from "../hooks/use-wizard-form";
import { setupForm } from "../lib/registry";
import { FieldOverrides } from "../lib/types";
import { RowAction, StepConfig, ToolbarAction } from "../lib/types/config";
import { PageQueryParams } from "../lib/types/query";
import { cn } from "../lib/utils";
import { getZodShape, zodQueryResolve } from "@repo/utils";
import { SdkProvider, useSdk } from "../provider/sdk-provider";
import _ from "lodash";

export interface CrudConfig<
  R extends FieldValues = {},
  C extends FieldValues = {},
  U extends FieldValues = {},
> {
  name: string;
  path: string;
  entitySchema: z.ZodObject;
  listMount?: string;
  listSchema: z.ZodObject<R>;
  listFields: FieldOverrides<R>;
  createSchema: z.ZodObject<C>;
  createFields: FieldOverrides<C>;
  createSteps?: StepConfig<C>[];
  editSchema: z.ZodObject<U>;
  editFields: FieldOverrides<U>;
}

interface MedusaCrudProps<
  R extends FieldValues,
  C extends FieldValues,
  U extends FieldValues,
> {
  children?: React.ReactNode;
  sdk: Medusa;
  config: CrudConfig<R, C, U>;
}

type MedusaCrudContext<TData = unknown> = {
  config: CrudConfig<any, any, any>;
  data: TData;
  setData: (data: Partial<TData>) => void;
};

const MedusaCrudContext = createContext<MedusaCrudContext | null>(null);
export const useMedusaCrud = <TData,>() => {
  const context = useContext(MedusaCrudContext);
  if (!context) {
    throw new Error("useMedusaCrud must be used within a MedusaCrudProvider");
  }
  return context as MedusaCrudContext<TData>;
};

/**
 * Wraps MedusaCrudInner with its own QueryClientProvider so that
 * @tanstack/react-query hooks (useQueryClient, useMutation, etc.) always
 * have a client available — regardless of whether the Medusa admin shell's
 * QueryClientProvider is in scope (which is not guaranteed for plugin routes
 * served from a pre-built bundle).
 */
function MedusaCrud<
  R extends FieldValues,
  C extends FieldValues,
  U extends FieldValues,
>({ children, sdk, config }: MedusaCrudProps<R, C, U>) {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  const { t } = useTranslation();
  const [data, setData] = useState<any>({});

  useEffect(() => {
    setupForm({
      translate: (key) => t(key),
      components: {
        text: ({ invalid, ...rest }) => (
          <Input {...rest} type="text" aria-invalid={invalid} />
        ),
        email: ({ invalid, ...rest }) => (
          <Input {...rest} type="email" aria-invalid={invalid} />
        ),
        password: ({ invalid, ...rest }) => (
          <Input {...rest} type="password" aria-invalid={invalid} />
        ),
        textarea: ({ invalid, ...rest }) => (
          <Textarea {...rest} aria-invalid={invalid} />
        ),
        checkbox: ({ onChange, value, invalid, ...rest }) => (
          <Switch
            {...rest}
            onCheckedChange={onChange}
            checked={value}
            aria-invalid={invalid}
          />
        ),
        number: ({ onChange, invalid, ...rest }) => (
          <Input
            {...rest}
            type="number"
            onChange={(e) => onChange?.(Number(e.target.value))}
            aria-invalid={invalid}
          />
        ),
        date: ({ invalid, ...rest }) => (
          <DatePicker {...rest} aria-invalid={invalid} />
        ),
        select: ({ options, placeholder, onChange, value, ...rest }) => (
          <Select {...rest} defaultValue={value} onValueChange={onChange}>
            <Select.Trigger>
              <Select.Value placeholder={placeholder} />
            </Select.Trigger>
            <Select.Content>
              {options?.map((opt) => (
                <Select.Item key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        ),
      },
      formUI: {
        label: ({ children, ...rest }) => <Label {...rest}>{children}</Label>,
        description: ({ children, ...rest }) => (
          <Hint {...rest}>{children}</Hint>
        ),
        errorMessage: ({ message, ...rest }) => (
          <Hint variant="error" {...rest}>
            {message}
          </Hint>
        ),
      },
      submitButton: ({ loading, disabled, children }) => (
        <Button
          size="small"
          type="submit"
          disabled={disabled || loading}
          className="my-button"
        >
          {loading ? "Loading..." : children}
        </Button>
      ),
      styles: {
        form: "h-full", // Applied to <form>
        formItem: "space-y-1 flex flex-col", // Applied to each field wrapper
        label: "text-xs font-medium capitalize", // Applied to labels
      },
    });
  }, [t]);

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <SdkProvider sdk={sdk}>
        <MedusaCrudContext.Provider value={{ config, data, setData }}>
          {children}
        </MedusaCrudContext.Provider>
      </SdkProvider>
    </QueryClientProvider>
  );
}

type MedusaCrudListProps<T extends { id: string }> = {
  title: string;
  description?: string;
  rowActions?: RowAction<T>[];
  toolbarActions?: ToolbarAction<T>[];
  onRowClick?: (row: T) => void;
};

MedusaCrud.List = function List<T extends { id: string }>({
  title,
  description,
  rowActions,
  toolbarActions,
  onRowClick,
  ...restProps
}: MedusaCrudListProps<T>) {
  const sdk = useSdk();
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { config } = useMedusaCrud();

  const queryFields = useMemo(
    () => zodQueryResolve(config.listSchema),
    [config.listSchema],
  );

  const listAction = (signal: AbortSignal, params?: PageQueryParams) =>
    sdk.client.fetch(`/admin${config.path}`, {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: queryFields,
      },
    });

  const deleteMutation = useDeleteMutation({
    invalidateKeys: [config.path],
    errorMessage: t("common.error_delete_item"),
    successMessage: t("common.success_delete_item"),
    deleteFn: (id: string) =>
      sdk.client.fetch(`/admin${config.path}/${id}`, { method: "DELETE" }),
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
      onClick: (row) =>
        navigate(`${config.path}/${row.id}/edit`, { state: row }),
    },
    {
      id: "delete",
      label: t("common.delete"),
      icon: <Trash />,
      variant: "danger",
      onClick: (row) => deleteMutation.mutateAsync(row.id),
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

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="font-sans font-medium h1-core">{title}</h1>
          {description && <Hint>{description}</Hint>}
        </div>
        <Button variant="secondary" size="small" asChild>
          <Link to={`${config.path}/create`}>Create</Link>
        </Button>
      </div>

      <DataTable
        id={config.path}
        schema={config.listSchema}
        fields={config.listFields}
        queryFn={listAction}
        selectFn={(resp: any) => {
          if (config.listMount !== undefined) {
            return {
              data: resp?.data[config.listMount] || [],
              rowCount: resp?.metadata.count ?? 0,
            };
          }

          return {
            data: resp?.data || [],
            rowCount: resp?.metadata.count || 0,
          };
        }}
        onRowClick={(row) => {
          if (onRowClick !== undefined) {
            return onRowClick(row);
          }
          navigate(`${config.path}/${row.id}`);
        }}
        rowActions={[...defaultRowActions, ...(rowActions || [])]}
        toolbarActions={[...defaultToolbarActions, ...(toolbarActions || [])]}
        {...restProps}
      />
    </Container>
  );
};

MedusaCrud.Create = function Create<T extends Record<string, any>>() {
  const sdk = useSdk();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { config } = useMedusaCrud();

  const createAction = (data: T): Promise<void> =>
    sdk.client.fetch(`/admin${config.path}`, { method: "POST", body: data });

  const mutate = useCreateMutation({
    invalidateKeys: [config.path],
    errorMessage: `Failed to create ${config.name}`,
    successMessage: `Successfully created ${config.name}`,
    createFn: createAction,
  });

  const dispose = () => {
    navigate(`${config.path}`, { replace: true });
  };

  const handleSubmit = async (values: T) => {
    if (config.createSteps && config.createSteps.length > 0) {
      await action.handleSubmit(values);
    } else {
      await mutate.mutateAsync(values);
    }
    dispose();
  };

  const [wizard, action] = useWizardForm(
    config.createSteps,
    async (values: T) => {
      await mutate.mutateAsync(values);
      dispose();
    },
  );

  const activeSchema = useMemo(
    () =>
      config.createSteps && config.createSteps.length > 0
        ? wizard.schema
        : config.createSchema,
    [wizard.schema, config.createSchema, config.createSteps],
  );

  if (!activeSchema) {
    throw new Error("Schema is required if no steps are provided");
  }

  const styles = {
    body: {
      wrapper: {
        base: "relative flex flex-col items-center p-16",
      },
      content: {
        base: "flex w-full flex-col",
        default: "max-w-[720px] w-full gap-y-8",
        full: "flex-1",
      },
    },
    header: {
      base: "flex flex-col gap-y-1",
      default: "flex flex-col gap-y-1",
      full: "flex flex-col gap-y-2",
    },
  };

  const getContentStyle = (step: StepConfig<T>) =>
    cn(
      styles.body.content.base,
      styles.body.content[step.display ?? "default"],
    );

  const getHeaderStyle = (step: StepConfig<T>) =>
    cn(styles.header.base, styles.header[step.display ?? "default"]);

  return (
    <FocusModal open={true} onOpenChange={dispose}>
      <FocusModal.Content>
        <Form
          overrides={config.createFields}
          schema={activeSchema}
          onSubmit={handleSubmit}
        >
          {({ renderField, renderSubmitButton, form }) => {
            if (config.createSteps && config.createSteps.length > 0) {
              return (
                <ProgressTabs
                  value={wizard.step}
                  className="flex flex-col h-full"
                  onValueChange={(tabId) => action.handleChange(tabId, form)}
                >
                  <FocusModal.Header>
                    <ProgressTabs.List className="-my-2 w-full border-l">
                      {config.createSteps.map(({ id, label }) => (
                        <ProgressTabs.Trigger key={id} value={id}>
                          {label}
                        </ProgressTabs.Trigger>
                      ))}
                    </ProgressTabs.List>
                  </FocusModal.Header>

                  <FocusModal.Body className={styles.body.wrapper.base}>
                    {config.createSteps.map((step) => {
                      if (wizard.step !== step.id) {
                        return <React.Fragment key={step.id} />;
                      }
                      return (
                        <ProgressTabs.Content
                          key={step.id}
                          value={step.id}
                          className={getContentStyle(step)}
                        >
                          {(step.header === undefined ||
                            step.header === true) && (
                            <div className={getHeaderStyle(step)}>
                              <Heading level="h1" className="">
                                {step.label}
                              </Heading>
                              {step.description && (
                                <Hint>{step.description}</Hint>
                              )}
                            </div>
                          )}

                          {wizard.fields.map((key) => renderField(key))}
                        </ProgressTabs.Content>
                      );
                    })}
                  </FocusModal.Body>
                  <FocusModal.Footer>
                    <div className="flex items-center justify-end gap-x-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={dispose}
                      >
                        {t("common.cancel")}
                      </Button>
                      {renderSubmitButton({
                        disabled: !form.formState.isValid && !wizard.hasNext,
                        children: wizard.hasNext ? (
                          t("common.next")
                        ) : (
                          <>
                            {t("common.create")}{" "}
                            <span className="capitalize">{config.name}</span>
                          </>
                        ),
                      })}
                    </div>
                  </FocusModal.Footer>
                </ProgressTabs>
              );
            }
            const shape = getZodShape(activeSchema);
            const fieldKeys = Object.keys(shape);
            return (
              <div className="flex flex-col h-full">
                <FocusModal.Header>
                  <FocusModal.Title>
                    <Heading level="h1">
                      Create <span className="capitalize">{config.name}</span>
                    </Heading>
                  </FocusModal.Title>
                </FocusModal.Header>
                <FocusModal.Body className={styles.body.wrapper.base}>
                  <div className={styles.body.content.default}>
                    {
                      fieldKeys.map((key) =>
                        renderField(key),
                      ) as unknown as React.ReactNode
                    }
                  </div>
                </FocusModal.Body>
                <FocusModal.Footer>
                  <div className="flex items-center justify-end gap-x-2">
                    <Button variant="secondary" size="small" onClick={dispose}>
                      {t("common.cancel")}
                    </Button>
                    {renderSubmitButton({
                      // disabled: !form.formState.isValid,
                      children: (
                        <>
                          {t("common.create")}{" "}
                          <span className="capitalize">{config.name}</span>
                        </>
                      ),
                    })}
                  </div>
                </FocusModal.Footer>
              </div>
            );
          }}
        </Form>
      </FocusModal.Content>
    </FocusModal>
  );
};

MedusaCrud.Detail = function Detail({
  id,
  dataMount,
  children,
}: {
  id?: string;
  dataMount?: string;
  children?: React.ReactNode;
}) {
  const { config, setData } = useMedusaCrud();
  const sdk = useSdk();

  const result = useQuery<Record<string, any>>({
    enabled: !!id,
    queryKey: [config.path],
    queryFn: async ({ signal }) => {
      const result = await sdk.client.fetch<{
        success: boolean;
        data: Record<string, any>;
      }>(`/admin${config.path}/${id}`, {
        method: "GET",
        signal,
        query: {
          fields: zodQueryResolve(config.entitySchema),
        },
      });

      const data = dataMount ? _.get(result, dataMount) : result.data;
      setData(data || {});
      return data;
    },
  });

  if (result.isLoading) {
    return <div>Loading...</div>;
  }

  if (result.isError) {
    return <div>Error: {String(result.error)}</div>;
  }

  if (!result.data) {
    return <div>No data found</div>;
  }

  return <>{children}</>;
};

MedusaCrud.Edit = function Edit<T extends { id: string }>() {
  const sdk = useSdk();
  const { config, data } = useMedusaCrud<T>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const dispose = () => {
    if (data?.id) {
      navigate(`${config.path}/${data.id}`);
    } else {
      navigate(`${config.path}`);
    }
  };

  const updateAction = (data: T): Promise<void> =>
    sdk.client.fetch(`/admin${config.path}/${data.id}`, {
      method: "PUT",
      body: data,
    });

  const mutation = useUpdateMutation({
    invalidateKeys: [config.path],
    errorMessage: `Failed to update ${config.name}`,
    successMessage: `Successfully updated ${config.name}`,
    updateFn: (data) => updateAction(data),
    onSuccess: () => dispose(),
  });

  const handleSubmit = async (values: T) => {
    await mutation.mutateAsync(values);
    dispose();
  };

  return (
    <Drawer open={true} onOpenChange={() => dispose()}>
      <Drawer.Content>
        <Form
          defaultValues={data}
          schema={config.editSchema}
          overrides={config.editFields}
          onSubmit={handleSubmit}
          className="flex flex-col h-full"
        >
          {({ renderField, renderSubmitButton }, fieldKeys) => {
            return (
              <>
                <Drawer.Header>
                  <Heading level="h2">
                    {t("common.edit")}{" "}
                    <span className="capitalize">{config.name}</span>
                  </Heading>
                  <Hint className="text-ui-fg-subtle text-sm mt-1"></Hint>
                </Drawer.Header>
                <Drawer.Body className="flex flex-col gap-y-4">
                  {fieldKeys.map((key) => renderField(key))}
                </Drawer.Body>
                <Drawer.Footer>
                  <Drawer.Close asChild>
                    <Button
                      variant="secondary"
                      size="small"
                      type="button"
                      onClick={() => dispose()}
                    >
                      {t("common.cancel")}
                    </Button>
                  </Drawer.Close>
                  {renderSubmitButton({
                    children: (
                      <>
                        {t("common.save")}{" "}
                        <span className="capitalize">{config.name}</span>
                      </>
                    ),
                  })}
                </Drawer.Footer>
              </>
            );
          }}
        </Form>
      </Drawer.Content>
    </Drawer>
  );
};

export { MedusaCrud };
