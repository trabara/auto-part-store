import { z } from "@medusajs/framework/zod";
import { Trash } from "@medusajs/icons";
import {
  Button,
  Checkbox,
  Container,
  DatePicker,
  Hint,
  Input,
  Label,
  Select,
  Textarea,
  UseDataTableReturn,
  useToggleState
} from "@medusajs/ui";
import { useLayoutEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import { sdk } from "../lib/sdk";
import { CreateConfig, EditConfig, ListConfig } from "../types/config";
import { Entity } from "../types/data";
import { PageQueryParams, PageResponse } from "../types/query";
import { zodQueryResolve } from "../utils/zod";
import CreateModal from "./create-modal";
import DataTable from "./data-table";
import EditDrawer from "./edit-drawer";
import { setupForm } from "@/registry";

interface MedusaPageProps<
  LS extends z.AnyZodObject,
  CS extends z.AnyZodObject,
  ES extends z.AnyZodObject,
  T extends Entity<z.infer<LS>>
> extends ListConfig<T> {
  path: string;
  create: CreateConfig<z.infer<CS>>;
  edit: EditConfig<z.infer<ES>>;
}

export function MedusaPage<
  LS extends z.AnyZodObject,
  CS extends z.AnyZodObject,
  ES extends z.AnyZodObject,
  T extends Entity<z.infer<LS>>
>({ id, path, schema, fields, create, edit, toolbarActions, rowActions, ...restProps }: MedusaPageProps<LS, CS, ES, T>) {
  const { t } = useTranslation();
  const [isCreateModalOpen, openCreateModal, closeCreateModal] = useToggleState()

  const queryFields = useMemo(() => zodQueryResolve(schema), [])

  const listAction = (signal: AbortSignal, params?: PageQueryParams) =>
    sdk.client.fetch<PageResponse<T>>(path, {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: queryFields,
      },
    })

  const createAction = (data: z.infer<CS>): Promise<void> =>
    sdk.client.fetch(path, { method: "POST", body: data })

  const updateAction = (id: string, data: z.infer<ES>): Promise<void> =>
    sdk.client.fetch(`${path}/${id}`, { method: "PATCH", body: data })

  const deleteAction = (id: string) =>
    sdk.client.fetch(`${path}/${id}`, { method: "DELETE" })


  const deleteMutation = useDeleteMutation({
    invalidateKeys: [id],
    errorMessage: 'Failed to delete item',
    successMessage: 'Item deleted successfully',
    deleteFn: (id: string) => deleteAction(id),
  })

  const handleBulkDelete = async (table: UseDataTableReturn<T>) => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original);
    const selectedIds = selectedRows.map((row) => row.id);
    await deleteMutation.mutateAsync(...selectedIds);
  }


  useLayoutEffect(() => {
    setupForm({
      translate: (key) => t(key),
      components: {
        text: ({ componentProps, invalid, ...rest }) => <Input {...rest} type="text" aria-invalid={invalid} />,
        email: ({ componentProps, invalid, ...rest }) => <Input {...rest} type="email" aria-invalid={invalid} />,
        password: ({ componentProps, invalid, ...rest }) => (
          <Input {...rest} type="password" aria-invalid={invalid} />
        ),
        textarea: ({ componentProps, invalid, ...rest }) => <Textarea {...rest} aria-invalid={invalid} />,
        checkbox: ({ componentProps, onChange, value, invalid, ...rest }) => (
          <Checkbox {...rest} onCheckedChange={onChange} checked={value} aria-invalid={invalid} />
        ),
        number: ({ componentProps, onChange, invalid, ...rest }) => (
          <Input
            {...rest}
            type="number"
            onChange={(e) => onChange?.(Number(e.target.value))}
            aria-invalid={invalid}
          />
        ),
        date: ({ componentProps, invalid, ...rest }) => <DatePicker {...rest} aria-invalid={invalid} />,
        select: ({
          componentProps,
          options,
          placeholder,
          onChange,
          value,
          ...rest
        }) => (
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
        description: ({ children, ...rest }) => <Hint {...rest}>{children}</Hint>,
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
        formItem: "mt-6 space-y-1 flex flex-col", // Applied to each field wrapper
        label: "text-xs font-medium capitalize", // Applied to labels
      },
    });
  }, [])


  return (
    <Container className="divide-y p-0">
      <DataTable
        id={id}
        schema={schema}
        fields={fields}
        queryFn={listAction}
        onCreateClicked={() => openCreateModal()}
        rowActions={
          [
            {
              id: 'edit',
              label: t('common.edit'),
              render: (row) => <EditDrawer
                id={id}
                schema={edit.schema}
                fields={edit.fields}
                mutateFn={updateAction}
                defaultValues={row}
              />
            },
            {
              id: 'delete',
              label: t('common.delete'),
              icon: <Trash />,
              variant: "danger",
              onClick: (row) => {
                deleteMutation.mutateAsync(row.id)
              }
            },
            ...(rowActions || [])
          ]
        }
        toolbarActions={[
          {
            id: 'delete',
            icon: <Trash />,
            variant: "danger",
            label: t('common.delete'),
            onClick: (table) => handleBulkDelete(table),
          },
          ...(toolbarActions || [])
        ]}
        {...restProps}
      />

      <CreateModal
        id={id}
        schema={create.schema}
        steps={create.steps}
        fields={create.fields}
        mutateFn={createAction}
        open={isCreateModalOpen}
        onOpenChange={() => closeCreateModal()}
      />
    </Container>
  );
}
