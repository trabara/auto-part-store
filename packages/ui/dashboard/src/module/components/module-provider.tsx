import type Medusa from "@medusajs/js-sdk";
import {
  Button,
  DatePicker,
  Hint,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  Toaster,
  TooltipProvider,
} from "@medusajs/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { setupForm } from "../../form/registry";
import { ModuleContext } from "../context/module";
import { MedusaModule } from "../types";
import MedusaCreatePage from "./feature-create";
import MedusaDetailsPage from "./feature-details";
import MedusaEditPage from "./feature-edit";
import MedusaListPage from "./feature-list";
import { SdkContext } from "../../common/context";

interface MedusaCrudProps {
  sdk: Medusa;
  module: MedusaModule;
  children?: React.ReactNode;
}

/**
 * Wraps MedusaCrudInner with its own QueryClientProvider so that
 * @tanstack/react-query hooks (useQueryClient, useMutation, etc.) always
 * have a client available — regardless of whether the Medusa admin shell's
 * QueryClientProvider is in scope (which is not guaranteed for plugin routes
 * served from a pre-built bundle).
 */
function Module({ children, sdk, module }: MedusaCrudProps) {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  const { t } = useTranslation();
  const [details, setDetails] = useState<any>({});

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
        label: ({ children, ...rest }) => (
          <Label {...rest}>
            <Text size="small">{children}</Text>
          </Label>
        ),
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
        <Button size="small" type="submit" disabled={disabled || loading}>
          {loading ? "Loading..." : children}
        </Button>
      ),
      styles: {
        form: "h-full", // Applied to <form>
        formItem: "flex flex-col space-y-2", // Applied to each field wrapper
        label: "font-sans txt-compact-small font-medium", // Applied to labels
      },
    });
  }, [t]);

  return (
    <SdkContext.Provider value={sdk}>
      <QueryClientProvider client={queryClientRef.current}>
        <ModuleContext.Provider value={module}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" />
        </ModuleContext.Provider>
      </QueryClientProvider>
    </SdkContext.Provider>
  );
}

Module.List = MedusaListPage;
Module.Create = MedusaCreatePage;
Module.Detail = MedusaDetailsPage;
Module.Edit = MedusaEditPage;

export { Module };
