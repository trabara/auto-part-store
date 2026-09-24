import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  toast
} from "@medusajs/ui";
import { sdk } from "@repo/admin/lib/sdk";
import { useEffect, useState } from "react";
import { SUPPORTED_PROVIDERS } from "./constant";
import ProviderDrawer from "./drawer";


export default function OAuthProvidersPage() {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { oauth_providers } = await sdk.client.fetch<{ oauth_providers: OAuthProvider[] }>("/admin/oauth-providers");
      setProviders(oauth_providers ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await sdk.client.fetch(`/admin/oauth-providers/${id}`, {
        method: "DELETE",
      });
      toast.success("Provider removed");
      fetchProviders();
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
