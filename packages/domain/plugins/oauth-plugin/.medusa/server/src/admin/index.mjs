import { jsxs, jsx } from "react/jsx-runtime";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Google } from "@medusajs/icons";
import { Heading, Text, Container, Badge, Button, Drawer, Label, Input, Switch, toast } from "@medusajs/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
const ProviderFormSchema = z.object({
  client_id: z.string().min(1, "Client ID is required"),
  client_secret: z.string().min(1, "Client Secret is required"),
  callback_url: z.string().url("Must be a valid URL"),
  success_redirect_url: z.string().url("Must be a valid URL"),
  enabled: z.boolean()
});
function ProviderDrawer({
  open,
  onOpenChange,
  provider,
  existing,
  onSaved
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(ProviderFormSchema),
    defaultValues: {
      client_id: (existing == null ? void 0 : existing.client_id) ?? "",
      client_secret: (existing == null ? void 0 : existing.client_secret) ?? "",
      callback_url: (existing == null ? void 0 : existing.callback_url) ?? "",
      success_redirect_url: (existing == null ? void 0 : existing.success_redirect_url) ?? "",
      enabled: (existing == null ? void 0 : existing.enabled) ?? false
    }
  });
  useEffect(() => {
    if (open) {
      reset({
        client_id: (existing == null ? void 0 : existing.client_id) ?? "",
        client_secret: (existing == null ? void 0 : existing.client_secret) ?? "",
        callback_url: (existing == null ? void 0 : existing.callback_url) ?? "",
        success_redirect_url: (existing == null ? void 0 : existing.success_redirect_url) ?? "",
        enabled: (existing == null ? void 0 : existing.enabled) ?? false
      });
    }
  }, [open, existing, reset]);
  const enabledValue = watch("enabled");
  const onSubmit = async (values) => {
    try {
      const res = await fetch("/admin/oauth-providers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ...values })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err == null ? void 0 : err.message) ?? "Failed to save provider");
        return;
      }
      toast.success(`${provider} provider saved`);
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Unexpected error");
    }
  };
  return /* @__PURE__ */ jsx(Drawer, { open, onOpenChange, children: /* @__PURE__ */ jsxs(Drawer.Content, { children: [
    /* @__PURE__ */ jsx(Drawer.Header, { children: /* @__PURE__ */ jsxs(Drawer.Title, { children: [
      "Configure ",
      provider,
      " OAuth"
    ] }) }),
    /* @__PURE__ */ jsxs(Drawer.Body, { className: "flex flex-col gap-y-4 overflow-y-auto p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-y-1", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "client_id", size: "small", children: "Client ID" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "client_id",
            placeholder: "Google client ID",
            ...register("client_id")
          }
        ),
        errors.client_id && /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-error", children: errors.client_id.message })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-y-1", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "client_secret", size: "small", children: "Client Secret" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "client_secret",
            type: "password",
            placeholder: "Google client secret",
            ...register("client_secret")
          }
        ),
        errors.client_secret && /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-error", children: errors.client_secret.message })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-y-1", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "callback_url", size: "small", children: "Callback URL" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "callback_url",
            placeholder: "https://api.example.com/store/auth/google/callback",
            ...register("callback_url")
          }
        ),
        errors.callback_url && /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-error", children: errors.callback_url.message })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-y-1", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "success_redirect_url", size: "small", children: "Storefront URL" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "success_redirect_url",
            placeholder: "https://store.example.com",
            ...register("success_redirect_url")
          }
        ),
        errors.success_redirect_url && /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-error", children: errors.success_redirect_url.message })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-x-3", children: [
        /* @__PURE__ */ jsx(
          Switch,
          {
            id: "enabled",
            checked: enabledValue,
            onCheckedChange: (checked) => setValue("enabled", checked)
          }
        ),
        /* @__PURE__ */ jsx(Label, { htmlFor: "enabled", size: "small", children: "Enabled" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Drawer.Footer, { children: [
      /* @__PURE__ */ jsx(Drawer.Close, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "secondary", size: "small", children: "Cancel" }) }),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "small",
          isLoading: isSubmitting,
          onClick: handleSubmit(onSubmit),
          children: "Save"
        }
      )
    ] })
  ] }) });
}
const SUPPORTED_PROVIDERS = [{ key: "google", label: "Google", icon: Google }];
function OAuthProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/admin/oauth-providers", {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.oauth_providers ?? []);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProviders();
  }, []);
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/admin/oauth-providers/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Provider removed");
        fetchProviders();
      }
    } catch {
      toast.error("Failed to remove provider");
    }
  };
  const openDrawer = (providerKey) => {
    setSelected(providerKey);
    setDrawerOpen(true);
  };
  const existingForSelected = providers.find((p) => p.provider === selected);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-y-2 p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx(Heading, { level: "h1", children: "OAuth Providers" }),
      /* @__PURE__ */ jsx(Text, { className: "text-ui-fg-subtle", children: "Configure social login providers for your storefront." })
    ] }),
    SUPPORTED_PROVIDERS.map(({ key, label, icon: Icon }) => {
      const existing = providers.find((p) => p.provider === key);
      return /* @__PURE__ */ jsxs(
        Container,
        {
          className: "flex items-center justify-between p-4",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-x-3", children: [
              /* @__PURE__ */ jsx(Icon, {}),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Text, { weight: "plus", children: label }),
                existing ? /* @__PURE__ */ jsx(
                  Badge,
                  {
                    color: existing.enabled ? "green" : "grey",
                    size: "xsmall",
                    children: existing.enabled ? "Enabled" : "Disabled"
                  }
                ) : /* @__PURE__ */ jsx(Badge, { color: "grey", size: "xsmall", children: "Not configured" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-x-2", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "secondary",
                  size: "small",
                  onClick: () => openDrawer(key),
                  children: existing ? "Edit" : "Configure"
                }
              ),
              existing && /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "danger",
                  size: "small",
                  onClick: () => handleDelete(existing.id),
                  children: "Remove"
                }
              )
            ] })
          ]
        },
        key
      );
    }),
    selected && /* @__PURE__ */ jsx(
      ProviderDrawer,
      {
        open: drawerOpen,
        onOpenChange: setDrawerOpen,
        provider: selected,
        existing: existingForSelected,
        onSaved: fetchProviders
      }
    ),
    loading && /* @__PURE__ */ jsx(Text, { className: "text-ui-fg-subtle text-center py-4", children: "Loading…" })
  ] });
}
const config = defineRouteConfig({
  label: "OAuth Providers"
});
const widgetModule = { widgets: [] };
const routeModule = {
  routes: [
    {
      Component: OAuthProvidersPage,
      path: "/settings/oauth-providers"
    }
  ]
};
const menuItemModule = {
  menuItems: [
    {
      label: config.label,
      icon: void 0,
      path: "/settings/oauth-providers",
      nested: void 0,
      rank: void 0,
      translationNs: void 0
    }
  ]
};
const formModule = { customFields: {} };
const displayModule = {
  displays: {}
};
const i18nModule = { resources: {} };
const plugin = {
  widgetModule,
  routeModule,
  menuItemModule,
  formModule,
  displayModule,
  i18nModule
};
export {
  plugin as default
};
