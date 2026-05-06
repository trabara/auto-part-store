"use strict";
const jsxRuntime = require("react/jsx-runtime");
const adminSdk = require("@medusajs/admin-sdk");
const ui = require("@medusajs/ui");
const Medusa = require("@medusajs/js-sdk");
const react = require("react");
const icons = require("@medusajs/icons");
const zod$1 = require("@hookform/resolvers/zod");
const reactHookForm = require("react-hook-form");
const zod = require("zod");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const Medusa__default = /* @__PURE__ */ _interopDefault(Medusa);
const sdk = new Medusa__default.default({
  baseUrl: "/",
  debug: false,
  auth: {
    type: "session"
  }
});
const SUPPORTED_PROVIDERS = [
  { key: "google", label: "Google", icon: icons.Google },
  { key: "apple", label: "Apple", icon: icons.Apple }
];
const ProviderFormSchema = zod.z.object({
  client_id: zod.z.string().min(1, "Client ID is required"),
  client_secret: zod.z.string().min(1, "Client Secret is required"),
  callback_url: zod.z.string().url("Must be a valid URL"),
  success_redirect_url: zod.z.string().url("Must be a valid URL"),
  enabled: zod.z.boolean()
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
  } = reactHookForm.useForm({
    resolver: zod$1.zodResolver(ProviderFormSchema),
    defaultValues: {
      client_id: (existing == null ? void 0 : existing.client_id) ?? "",
      client_secret: (existing == null ? void 0 : existing.client_secret) ?? "",
      callback_url: (existing == null ? void 0 : existing.callback_url) ?? "",
      success_redirect_url: (existing == null ? void 0 : existing.success_redirect_url) ?? "",
      enabled: (existing == null ? void 0 : existing.enabled) ?? false
    }
  });
  react.useEffect(() => {
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
        ui.toast.error((err == null ? void 0 : err.message) ?? "Failed to save provider");
        return;
      }
      ui.toast.success(`${provider} provider saved`);
      onOpenChange(false);
      onSaved();
    } catch {
      ui.toast.error("Unexpected error");
    }
  };
  return /* @__PURE__ */ jsxRuntime.jsx(ui.Drawer, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntime.jsxs(ui.Drawer.Content, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(ui.Drawer.Header, { children: /* @__PURE__ */ jsxRuntime.jsxs(ui.Drawer.Title, { children: [
      "Configure ",
      provider,
      " OAuth"
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(ui.Drawer.Body, { className: "flex flex-col gap-y-4 overflow-y-auto p-6", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "client_id", size: "small", children: "Client ID" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Input,
          {
            id: "client_id",
            placeholder: `${provider} client ID`,
            ...register("client_id")
          }
        ),
        errors.client_id && /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", className: "text-ui-fg-error", children: errors.client_id.message })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "client_secret", size: "small", children: "Client Secret" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Input,
          {
            id: "client_secret",
            type: "password",
            placeholder: `${provider} client secret`,
            ...register("client_secret")
          }
        ),
        errors.client_secret && /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", className: "text-ui-fg-error", children: errors.client_secret.message })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "callback_url", size: "small", children: "Callback URL" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Input,
          {
            id: "callback_url",
            placeholder: `https://api.example.com/store/auth/${provider}/callback`,
            ...register("callback_url")
          }
        ),
        errors.callback_url && /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", className: "text-ui-fg-error", children: errors.callback_url.message })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-1", children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "success_redirect_url", size: "small", children: "Storefront URL" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Input,
          {
            id: "success_redirect_url",
            placeholder: `https://store.example.com`,
            ...register("success_redirect_url")
          }
        ),
        errors.success_redirect_url && /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", className: "text-ui-fg-error", children: errors.success_redirect_url.message })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-x-3", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Switch,
          {
            id: "enabled",
            checked: enabledValue,
            onCheckedChange: (checked) => setValue("enabled", checked)
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "enabled", size: "small", children: "Enabled" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(ui.Drawer.Footer, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(ui.Drawer.Close, { asChild: true, children: /* @__PURE__ */ jsxRuntime.jsx(ui.Button, { variant: "secondary", size: "small", children: "Cancel" }) }),
      /* @__PURE__ */ jsxRuntime.jsx(
        ui.Button,
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
function OAuthProvidersPage() {
  const [providers, setProviders] = react.useState([]);
  const [loading, setLoading] = react.useState(true);
  const [drawerOpen, setDrawerOpen] = react.useState(false);
  const [selected, setSelected] = react.useState(null);
  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { oauth_providers } = await sdk.client.fetch("/admin/oauth-providers");
      setProviders(oauth_providers ?? []);
    } finally {
      setLoading(false);
    }
  };
  react.useEffect(() => {
    fetchProviders();
  }, []);
  const handleDelete = async (id) => {
    try {
      await sdk.client.fetch(`/admin/oauth-providers/${id}`, {
        method: "DELETE"
      });
      ui.toast.success("Provider removed");
      fetchProviders();
    } catch {
      ui.toast.error("Failed to remove provider");
    }
  };
  const openDrawer = (providerKey) => {
    setSelected(providerKey);
    setDrawerOpen(true);
  };
  const existingForSelected = providers.find((p) => p.provider === selected);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-2 p-6", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntime.jsx(ui.Heading, { level: "h1", children: "OAuth Providers" }),
      /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { className: "text-ui-fg-subtle", children: "Configure social login providers for your storefront." })
    ] }),
    SUPPORTED_PROVIDERS.map(({ key, label, icon: Icon }) => {
      const existing = providers.find((p) => p.provider === key);
      return /* @__PURE__ */ jsxRuntime.jsxs(
        ui.Container,
        {
          className: "flex items-center justify-between p-4",
          children: [
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-x-3", children: [
              /* @__PURE__ */ jsxRuntime.jsx(Icon, {}),
              /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { weight: "plus", children: label }),
                existing ? /* @__PURE__ */ jsxRuntime.jsx(
                  ui.Badge,
                  {
                    color: existing.enabled ? "green" : "grey",
                    size: "xsmall",
                    children: existing.enabled ? "Enabled" : "Disabled"
                  }
                ) : /* @__PURE__ */ jsxRuntime.jsx(ui.Badge, { color: "grey", size: "xsmall", children: "Not configured" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-x-2", children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                ui.Button,
                {
                  variant: "secondary",
                  size: "small",
                  onClick: () => openDrawer(key),
                  children: existing ? "Edit" : "Configure"
                }
              ),
              existing && /* @__PURE__ */ jsxRuntime.jsx(
                ui.Button,
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
    selected && /* @__PURE__ */ jsxRuntime.jsx(
      ProviderDrawer,
      {
        open: drawerOpen,
        onOpenChange: setDrawerOpen,
        provider: selected,
        existing: existingForSelected,
        onSaved: fetchProviders
      }
    ),
    loading && /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { className: "text-ui-fg-subtle text-center py-4", children: "Loading…" })
  ] });
}
const config = adminSdk.defineRouteConfig({
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
module.exports = plugin;
