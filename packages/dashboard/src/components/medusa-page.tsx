import { z } from "@medusajs/framework/zod";
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
  usePrompt,
  useToggleState,
  type DataTableFilter,
} from "@medusajs/ui";
import { setupSnowForm } from "@snowpact/react-rhf-zod-form";
import { useMemo, useState } from "react";
import { createZodDataTableColumnDef } from "../helpers/zod-column-def";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import { CreateConfig, EditConfig, MedusaFieldOverrides } from "../types/config";
import { Entity } from "../types/data";
import { PageResponse, QueryFn } from "../types/query";
import CreateModal from "./create-modal";
import DataTable from "./data-table";
import EditDrawer from "./edit-drawer";

setupSnowForm({
  translate: (key) => key,
  components: {
    text: ({ componentProps, invalid, ...rest }) => <Input {...rest} type="text" aria-invalid={invalid} />,
    email: ({ componentProps, invalid, ...rest }) => <Input {...rest} type="email" aria-invalid={invalid} />,
    password: ({ componentProps, invalid, ...rest }) => (
      <Input {...rest} type="password" aria-invalid={invalid} />
    ),
    textarea: ({ componentProps, invalid, ...rest }) => <Textarea {...rest} aria-invalid={invalid} />,
    checkbox: ({ componentProps, onChange, value, ...rest }) => (
      <Checkbox {...rest} onCheckedChange={onChange} checked={value} />
    ),
    number: ({ componentProps, onChange, ...rest }) => (
      <Input
        {...rest}
        type="number"
        onChange={(e) => onChange?.(Number(e.target.value))}
      />
    ),
    date: ({ componentProps, ...rest }) => <DatePicker {...rest} />,
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
      variant="secondary"
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


interface MedusaPageProps<
  LS extends z.AnyZodObject,
  CS extends z.AnyZodObject,
  ES extends z.AnyZodObject,
  T extends Entity<z.infer<LS>>,
  R extends PageResponse<T>,
> {
  name: string;
  description?: string;
  actionToolBar?: boolean;
  schema: LS;
  fields: MedusaFieldOverrides<T>;
  deleteFn: (id: string) => Promise<any>;
  queryFn: QueryFn<T, R>;
  create: CreateConfig<CS>;
  edit: EditConfig<ES>;
}

export function MedusaPage<
  LS extends z.AnyZodObject,
  CS extends z.AnyZodObject,
  ES extends z.AnyZodObject,
  T extends Entity<z.infer<LS>>,
  R extends PageResponse<T>,
>({ name, schema, fields, create, edit, queryFn, deleteFn, ...restProps }: MedusaPageProps<LS, CS, ES, T, R>) {
  const [isCreateModalOpen, openCreateModal, closeCreateModal] = useToggleState()
  const [isEditDrawerOpen, openEditDrawer, closeEditDrawer] = useToggleState()
  const [selectedRow, setSelectedRow] = useState<T>()
  const prompt = usePrompt()

  const deleteMutation = useDeleteMutation({
    invalidateKeys: [name],
    errorMessage: 'Failed to delete item',
    successMessage: 'Item deleted successfully',
    deleteFn: (id: string) => deleteFn?.(id) || Promise.resolve(),
  })

  const columns = useMemo(() => {
    return createZodDataTableColumnDef({
      schema,
      fields,
      onRowAction(action, row) {
        switch (action) {
          case "edit":
            setSelectedRow(row);
            openEditDrawer();
            break;
          case "delete":
            deleteMutation.mutateAsync(row.id);
            break;
        }
      },
    });
  }, []);

  const filters = useMemo((): DataTableFilter[] => {
    return [];
  }, []);

  return (
    <Container className="divide-y p-0">
      <DataTable
        name={name}
        columns={columns}
        filters={filters}
        queryFn={queryFn}
        deleteFn={deleteFn}
        onCreateClicked={() => openCreateModal()}
        {...restProps}
      />

      <CreateModal
        name={name}
        schema={create.schema}
        steps={create.steps}
        fields={create.fields}
        mutateFn={create.mutateFn}
        open={isCreateModalOpen}
        onOpenChange={() => closeCreateModal()}
      />

      <EditDrawer
        name={name}
        schema={edit.schema}
        fields={edit.fields}
        mutateFn={edit.mutateFn}
        defaultValues={selectedRow}
        open={isEditDrawerOpen}
        onOpenChange={() => closeEditDrawer()}
      />

    </Container>
  );
}
