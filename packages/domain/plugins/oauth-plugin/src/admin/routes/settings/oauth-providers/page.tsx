import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Google } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  toast,
} from "@medusajs/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

type OAuthProvider = {
  id: string;
  provider: string;
  client_id: string;
  client_secret: string;
  callback_url: string;
  success_redirect_url: string;
  enabled: boolean;
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const ProviderFormSchema = z.object({
  client_id: z.string().min(1, "Client ID is required"),
  client_secret: z.string().min(1, "Client Secret is required"),
  callback_url: z.string().url("Must be a valid URL"),
  success_redirect_url: z.string().url("Must be a valid URL"),
  enabled: z.boolean(),
});

type ProviderFormValues = z.infer<typeof ProviderFormSchema>;

// ─── ProviderDrawer ───────────────────────────────────────────────────────────

function ProviderDrawer({
  open,
  onOpenChange,
  provider,
  existing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  existing?: OAuthProvider;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProviderFormValues>({
    resolver: zodResolver(ProviderFormSchema),
    defaultValues: {
      client_id: existing?.client_id ?? "",
      client_secret: existing?.client_secret ?? "",
      callback_url: existing?.callback_url ?? "",
      success_redirect_url: existing?.success_redirect_url ?? "",
      enabled: existing?.enabled ?? false,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        client_id: existing?.client_id ?? "",
        client_secret: existing?.client_secret ?? "",
        callback_url: existing?.callback_url ?? "",
        success_redirect_url: existing?.success_redirect_url ?? "",
        enabled: existing?.enabled ?? false,
      });
    }
  }, [open, existing, reset]);

  const enabledValue = watch("enabled");

  const onSubmit = async (values: ProviderFormValues) => {
    try {
      const res = await fetch("/admin/oauth-providers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ...values }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.message ?? "Failed to save provider");
        return;
      }

      toast.success(`${provider} provider saved`);
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Unexpected error");
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Configure {provider} OAuth</Drawer.Title>
        </Drawer.Header>

        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto p-6">
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="client_id" size="small">
              Client ID
            </Label>
            <Input
              id="client_id"
              placeholder="Google client ID"
              {...register("client_id")}
            />
            {errors.client_id && (
              <Text size="small" className="text-ui-fg-error">
                {errors.client_id.message}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-y-1">
            <Label htmlFor="client_secret" size="small">
              Client Secret
            </Label>
            <Input
              id="client_secret"
              type="password"
              placeholder="Google client secret"
              {...register("client_secret")}
            />
            {errors.client_secret && (
              <Text size="small" className="text-ui-fg-error">
                {errors.client_secret.message}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-y-1">
            <Label htmlFor="callback_url" size="small">
              Callback URL
            </Label>
            <Input
              id="callback_url"
              placeholder="https://api.example.com/store/auth/google/callback"
              {...register("callback_url")}
            />
            {errors.callback_url && (
              <Text size="small" className="text-ui-fg-error">
                {errors.callback_url.message}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-y-1">
            <Label htmlFor="success_redirect_url" size="small">
              Storefront URL
            </Label>
            <Input
              id="success_redirect_url"
              placeholder="https://store.example.com"
              {...register("success_redirect_url")}
            />
            {errors.success_redirect_url && (
              <Text size="small" className="text-ui-fg-error">
                {errors.success_redirect_url.message}
              </Text>
            )}
          </div>

          <div className="flex items-center gap-x-3">
            <Switch
              id="enabled"
              checked={enabledValue}
              onCheckedChange={(checked) => setValue("enabled", checked)}
            />
            <Label htmlFor="enabled" size="small">
              Enabled
            </Label>
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary" size="small">
              Cancel
            </Button>
          </Drawer.Close>
          <Button
            size="small"
            isLoading={isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SUPPORTED_PROVIDERS = [{ key: "google", label: "Google", icon: Google }];

export default function OAuthProvidersPage() {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/admin/oauth-providers", {
        credentials: "include",
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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/admin/oauth-providers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Provider removed");
        fetchProviders();
      }
    } catch {
      toast.error("Failed to remove provider");
    }
  };

  const openDrawer = (providerKey: string) => {
    setSelected(providerKey);
    setDrawerOpen(true);
  };

  const existingForSelected = providers.find((p) => p.provider === selected);

  return (
    <div className="flex flex-col gap-y-2 p-6">
      <div className="mb-4">
        <Heading level="h1">OAuth Providers</Heading>
        <Text className="text-ui-fg-subtle">
          Configure social login providers for your storefront.
        </Text>
      </div>

      {SUPPORTED_PROVIDERS.map(({ key, label, icon: Icon }) => {
        const existing = providers.find((p) => p.provider === key);

        return (
          <Container
            key={key}
            className="flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-x-3">
              <Icon />
              <div>
                <Text weight="plus">{label}</Text>
                {existing ? (
                  <Badge
                    color={existing.enabled ? "green" : "grey"}
                    size="xsmall"
                  >
                    {existing.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                ) : (
                  <Badge color="grey" size="xsmall">
                    Not configured
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-x-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => openDrawer(key)}
              >
                {existing ? "Edit" : "Configure"}
              </Button>
              {existing && (
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDelete(existing.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          </Container>
        );
      })}

      {selected && (
        <ProviderDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          provider={selected}
          existing={existingForSelected}
          onSaved={fetchProviders}
        />
      )}

      {loading && (
        <Text className="text-ui-fg-subtle text-center py-4">Loading…</Text>
      )}
    </div>
  );
}

export const config = defineRouteConfig({
  label: "OAuth Providers",
});
