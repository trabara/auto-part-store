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
  type DataTableFilter,
} from "@medusajs/ui";
import { setupSnowForm } from "@snowpact/react-rhf-zod-form";
import { FieldOverrides } from "@snowpact/react-rhf-zod-form/src/types";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { createSchemaDataTableColumnDef } from "../helpers/column-def";
import { CellOverrides, CreateConfig, EditConfig } from "../types/config";
import { PageResponse, QueryFn } from "../types/query";
import CreateModal from "./create-modal";
import DataTable from "./data-table";
import EditDrawer from "./edit-drawer";

setupSnowForm({
  translate: (key) => key,
  components: {
    text: ({ componentProps, ...rest }) => <Input {...rest} type="text" />,
    email: ({ componentProps, ...rest }) => <Input {...rest} type="email" />,
    password: ({ componentProps, ...rest }) => (
      <Input {...rest} type="password" />
    ),
    textarea: ({ componentProps, ...rest }) => <Textarea {...rest} />,
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
  LS extends z.ZodObject<any>,
  CS extends z.AnyZodObject,
  ES extends z.AnyZodObject,
  R extends PageResponse<z.infer<LS>>,
> {
  name: string;
  schema: LS;
  fields: FieldOverrides<z.infer<LS>> | CellOverrides<z.infer<LS>>;
  queryFn: QueryFn<z.infer<LS>, R>;
  create?: CreateConfig<CS>;
  edit?: EditConfig<ES>;
}

export function MedusaPage<
  LS extends z.ZodObject<any>,
  CS extends z.AnyZodObject,
  ES extends z.AnyZodObject,
  R extends PageResponse<z.infer<LS>>,
>({ name, schema, queryFn, fields, create, edit }: MedusaPageProps<LS, CS, ES, R>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const columns = useMemo(() => {
    return createSchemaDataTableColumnDef(schema, fields);
  }, [schema, fields]);

  const filters = useMemo((): DataTableFilter[] => {
    return [];
  }, []);

  return (
    <Container className="divide-y p-0">
      <DataTable
        name={name}
        columns={columns}
        filters={filters}
        queryFn={queryFn as any}
        onCreateClicked={() => setSearchParams({ op: "create" })}
      />

      {create && (
        <CreateModal
          name={name}
          schema={create.schema}
          steps={create.steps}
          mutateFn={create.mutateFn}
          fields={{ ...fields, ...create.fields }}
          open={searchParams.get("op") === "create"}
          onOpenChange={() => setSearchParams({})}
        />
      )}

      {edit &&
        <EditDrawer
          name={name}
          schema={edit.schema}
          mutateFn={edit.mutateFn}
          fields={{ ...fields, ...edit.fields }}
          open={searchParams.get("op") === "edit"}
          onOpenChange={() => setSearchParams({})}
        />
      }
    </Container>
  );
}
