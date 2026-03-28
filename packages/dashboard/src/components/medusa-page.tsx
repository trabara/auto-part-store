import { Button, Checkbox, Container, DatePicker, Hint, Input, Label, Select, Textarea } from "@medusajs/ui";
import { setupSnowForm } from "@snowpact/react-rhf-zod-form";
import { FieldOverrides } from "@snowpact/react-rhf-zod-form/src/types";
import { useMemo } from "react";
import { useSearchParams } from 'react-router-dom';
import { createSchemaDataTableColumnDef } from "../helpers/column-def";
import { CrudConfig } from "../types/config";
import { PageResponse } from "../types/query";
import CreateModal from "./create-modal";
import DataTableList from "./data-table";
import EditDrawer from "./edit-drawer";
import { DataTableBulkActionsToolbar } from "./bulk-actions-toolbar";

setupSnowForm({
  translate: (key) => key,
  // Essential components (a warning is logged if any are missing)
  components: {
    text: ({ componentProps, ...rest }) =>
      <Input {...rest} type="text" />,
    email: ({ componentProps, ...rest }) =>
      <Input {...rest} type="email" />,
    password: ({ componentProps, ...rest }) =>
      <Input {...rest} type="password" />,
    textarea: ({ componentProps, ...rest }) =>
      <Textarea {...rest} />,
    checkbox: ({ componentProps, onChange, value, ...rest }) =>
      <Checkbox {...rest} onCheckedChange={onChange} checked={value} />,
    number: ({ componentProps, onChange, ...rest }) =>
      <Input {...rest} type="number" onChange={(e) => onChange?.(Number(e.target.value))} />,
    date: ({ componentProps, ...rest }) =>
      <DatePicker {...rest} />,
    select: ({
      componentProps,
      options,
      placeholder,
      onChange,
      value,
      ...rest
    }) => (
      <Select {...rest} defaultValue={value} onValueChange={onChange} >
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
    )
  },
  formUI: {
    label: ({ children, ...rest }) => <Label {...rest}>{children}</Label>,
    description: ({ children, ...rest }) => <Hint {...rest}>{children}</Hint>,
    errorMessage: ({ message, ...rest }) => <Hint variant="error" {...rest}>{message}</Hint>,
  },
  submitButton: ({ loading, disabled, children }) => (
    <Button variant="secondary" size="small" type="submit" disabled={disabled || loading} className="my-button">
      {loading ? 'Loading...' : children}
    </Button>
  ),
  styles: {
    form: 'h-full',              // Applied to <form>
    formItem: 'mt-6 space-y-1 flex flex-col',         // Applied to each field wrapper
    label: 'text-xs font-medium capitalize',   // Applied to labels
  },
});

interface MedusaPageProps<T extends { id: string }, Response extends PageResponse<T>> {
  name: string;
  fields: FieldOverrides<T>;
  config: CrudConfig<T, Response>;
}

export function MedusaPage<
  T extends { id: string },
  R extends PageResponse<T> = PageResponse<T>>({ name, fields, config, }: MedusaPageProps<T, R>) {


  const [searchParams, setSearchParams] = useSearchParams()

  const columns = useMemo(() => {
    return createSchemaDataTableColumnDef(config.list.schema)
  }, [])

  const filters = useMemo(() => {
    return []
  }, [])

  return (
    <Container className="divide-y p-0">
      <DataTableList<T, R>
        name={name}
        columns={columns as any}
        filters={filters}
        queryFn={config.list.fetcher}
        onCreateClicked={() => setSearchParams({ op: 'create' })}
      />

      <CreateModal
        name={name}
        steps={config.create.steps}
        fetcher={config.create.fetcher}
        fields={{ ...fields, ...config.create.fields }}
        open={searchParams.get("op") === 'create'}
        onOpenChange={() => setSearchParams({})}
      />


      <EditDrawer
        name={name}
        schema={config.update.schema}
        fetcher={config.update.fetcher}
        fields={{ ...fields, ...config.update.fields }}
        open={searchParams.get("op") === 'edit'}
        onOpenChange={() => setSearchParams({})}
      />

    </Container>
  )
}