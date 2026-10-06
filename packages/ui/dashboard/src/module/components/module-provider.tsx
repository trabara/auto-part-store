import type Medusa from "@medusajs/js-sdk";
import type { DetailSectionDef, ModuleDef } from "@repo/framework/core";
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
import { adminSdk } from "../../common/admin-sdk";
import { SdkContext } from "../../common/context";
import { setupForm } from "../../form/registry";
import { ModuleContext } from "../context/module";

interface ModuleProps {
  /** Medusa client; defaults to the shared admin client (`adminSdk()`). */
  sdk?: Medusa;
  module: ModuleDef;
  /**
   * Extra detail-page panels by feature key. Given here (by the admin page)
   * rather than in the module definition, which must stay free of UI code.
   */
  sections?: Readonly<Record<string, readonly DetailSectionDef[]>>;
  children?: React.ReactNode;
}

/**
 * Wraps ModuleInner with its own QueryClientProvider so that
 * @tanstack/react-query hooks (useQueryClient, useMutation, etc.) always
 * have a client available — regardless of whether the Medusa admin shell's
 * QueryClientProvider is in scope (which is not guaranteed for plugin routes
 * served from a pre-built bundle).
 */
function Module({ children, sdk, module, sections }: ModuleProps) {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  const { t } = useTranslation();
  const [state, setState] = useState<{}>({});

  useEffect(() => {
    setupForm({
      translate: (key) => t(key),
      // Registered components receive form-level props (`invalid`,
      // `componentProps`) that must not reach DOM elements; inputs stay
      // controlled (null/undefined render as empty).
      components: {
        text: ({ invalid, componentProps, value, ...rest }) => (
          <Input {...rest} {...componentProps} value={(value as string) ?? ""} type="text" aria-invalid={invalid} />
        ),
        email: ({ invalid, componentProps, value, ...rest }) => (
          <Input {...rest} {...componentProps} value={(value as string) ?? ""} type="email" aria-invalid={invalid} />
        ),
        password: ({ invalid, componentProps, value, ...rest }) => (
          <Input {...rest} {...componentProps} value={(value as string) ?? ""} type="password" aria-invalid={invalid} />
        ),
        textarea: ({ invalid, componentProps, value, ...rest }) => (
          <Textarea {...rest} {...componentProps} value={(value as string) ?? ""} aria-invalid={invalid} />
        ),
        checkbox: ({ onChange, value, invalid, componentProps, ...rest }) => (
          <Switch
            {...rest}
            {...componentProps}
            onCheckedChange={onChange}
            checked={!!value}
            aria-invalid={invalid}
          />
        ),
        number: ({ onChange, invalid, componentProps, value, ...rest }) => (
          <Input
            {...rest}
            {...componentProps}
            type="number"
            value={(value as number | null | undefined) ?? ""}
            onChange={(e) => onChange?.(e.target.value === "" ? null : Number(e.target.value))}
            aria-invalid={invalid}
          />
        ),
        date: ({ invalid, componentProps, ...rest }) => (
          <DatePicker {...(rest as any)} {...componentProps} aria-invalid={invalid} />
        ),
        select: ({ options, placeholder, onChange, value, invalid, componentProps, ...rest }) => (
          <Select
            {...(rest as any)}
            {...componentProps}
            // No value (not "") when empty, so Radix shows the placeholder and
            // doesn't report "" back over the field's default.
            value={value == null || value === "" ? undefined : String(value)}
            onValueChange={onChange}
          >
            <Select.Trigger aria-invalid={invalid}>
              {/* Explicit label: Radix only knows item labels once opened, so a
                  value set while closed (e.g. a seeded default) would show blank. */}
              <Select.Value placeholder={placeholder}>
                {options?.find((opt) => opt.value === value)?.label}
              </Select.Value>
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
        label: ({ children, required, invalid: _invalid, ...rest }: any) => (
          <Label {...rest}>
            <Text size="small">
              {children}
              {required && <span aria-hidden="true"> *</span>}
            </Text>
          </Label>
        ),
        description: ({ children, invalid: _invalid, required: _required, ...rest }: any) => (
          <Hint {...rest}>{children}</Hint>
        ),
        errorMessage: ({ message, invalid: _invalid, required: _required, ...rest }: any) => (
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
    <SdkContext.Provider value={sdk ?? adminSdk()}>
      <QueryClientProvider client={queryClientRef.current}>
        <ModuleContext.Provider value={{ module, state, setState, sections }}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" />
        </ModuleContext.Provider>
      </QueryClientProvider>
    </SdkContext.Provider>
  );
}

export { Module };
