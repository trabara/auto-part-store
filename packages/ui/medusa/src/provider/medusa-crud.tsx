import type Medusa from "@medusajs/js-sdk";
import {
  Button,
  DatePicker,
  Hint,
  Input,
  Label,
  Select,
  Switch,
  Textarea,
  Toaster,
  TooltipProvider,
} from "@medusajs/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { MedusaCrudContext } from "../context/crud";
import { setupForm } from "../lib/registry";
import { CrudConfig } from "../lib/types/config";
import MedusaCreatePage from "../pages/create";
import MedusaDetailsPage from "../pages/details";
import MedusaEditPage from "../pages/edit";
import MedusaListPage from "../pages/list";
import { SdkProvider } from "../provider/sdk-provider";

interface MedusaCrudProps<
  R extends FieldValues,
  C extends FieldValues,
  U extends FieldValues,
> {
  children?: React.ReactNode;
  sdk: Medusa;
  config: CrudConfig<R, C, U>;
}

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
      <MedusaCrudContext.Provider value={{ config, data, setData }}>
        <SdkProvider sdk={sdk}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" />
        </SdkProvider>
      </MedusaCrudContext.Provider>
    </QueryClientProvider>
  );
}

MedusaCrud.List = MedusaListPage;
MedusaCrud.Create = MedusaCreatePage;
MedusaCrud.Detail = MedusaDetailsPage;
MedusaCrud.Edit = MedusaEditPage;

export { MedusaCrud };
