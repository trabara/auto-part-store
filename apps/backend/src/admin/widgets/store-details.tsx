import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { EllipsisHorizontal, PencilSquare, Spinner } from "@medusajs/icons";
import {
  Container,
  DropdownMenu,
  Heading,
  IconButton,
  Text,
} from "@medusajs/ui";
import { sdk } from "@repo/admin/lib/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LogoSection } from "../components/logo-section";
import { StoreDetailsDrawer } from "../components/store-details-drawer";

type StoreDetailsResponse = {
  store_details: {
    id: string;
    name: string;
    logo_url: string | null;
    map_url: string | null;
    address: string | null;
    contact_emails: string[] | null;
    contact_phone_numbers: string[] | null;
    social_links: Record<string, string> | null;
  } | null;
};

export default function StoreDetailsWidget() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["store-details"],
    queryFn: () =>
      sdk.client.fetch<StoreDetailsResponse>("/admin/stores/details", {
        method: "GET",
      }),
  });

  const details = data?.store_details ?? null;

  return (
    <Container className="p-0 divide-y">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">{t("store.details.title")}</Heading>
        <StoreDetailsDrawer
          current={details}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <IconButton variant="transparent">
              <EllipsisHorizontal />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onSelect={() => setDrawerOpen(true)}>
              <PencilSquare className="size-4" />
              {t("store.details.edit")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-y-4">
          {/* General Info */}
          <div className="divide-y p-0">
            <div className="px-6 py-4">
              <Heading level="h2">{t("store.details.general")}</Heading>
            </div>

            <div className="flex flex-col gap-y-1 px-6 py-4">
              <LogoSection
                logoUrl={details?.logo_url ?? null}
                storeDetailsId={details?.id ?? null}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <div className="flex flex-col gap-y-1">
                <Text size="small" weight="plus" leading="compact">
                  {t("store.details.storeName")}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {details?.name ?? "—"}
                </Text>
              </div>

              <div className="flex flex-col gap-y-1">
                <Text size="small" weight="plus" leading="compact">
                  {t("store.details.address")}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {details?.address ?? "—"}
                </Text>
              </div>

              <div className="col-span-2 flex flex-col gap-y-1">
                <Text size="small" weight="plus" leading="compact">
                  {t("store.details.mapEmbedUrl")}
                </Text>
                <Text size="small" className="text-ui-fg-subtle break-all">
                  {details?.map_url ?? "—"}
                </Text>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="divide-y p-0">
            <div className="px-6 py-4">
              <Heading level="h2">{t("store.details.contact")}</Heading>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <div className="flex flex-col gap-y-1">
                <Text size="small" weight="plus" leading="compact">
                  {t("store.details.emailAddresses")}
                </Text>
                {details?.contact_emails?.length ? (
                  <div className="flex flex-col gap-y-1">
                    {details.contact_emails.map((email) => (
                      <Text
                        key={email}
                        size="small"
                        className="text-ui-fg-subtle"
                      >
                        {email}
                      </Text>
                    ))}
                  </div>
                ) : (
                  <Text size="small" className="text-ui-fg-subtle">
                    —
                  </Text>
                )}
              </div>

              <div className="flex flex-col gap-y-1">
                <Text size="small" weight="plus" leading="compact">
                  {t("store.details.phoneNumbers")}
                </Text>
                {details?.contact_phone_numbers?.length ? (
                  <div className="flex flex-col gap-y-1">
                    {details.contact_phone_numbers.map((phone) => (
                      <Text
                        key={phone}
                        size="small"
                        className="text-ui-fg-subtle"
                      >
                        {phone}
                      </Text>
                    ))}
                  </div>
                ) : (
                  <Text size="small" className="text-ui-fg-subtle">
                    —
                  </Text>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="divide-y p-0">
            <div className="px-6 py-4">
              <Heading level="h2">{t("store.details.socialLinks")}</Heading>
            </div>
            <div className="px-6 py-4">
              {details?.social_links &&
              Object.keys(details.social_links).length > 0 ? (
                <div className="flex flex-col gap-y-2">
                  {Object.entries(details.social_links).map(
                    ([platform, url]) => (
                      <div key={platform} className="flex items-center gap-x-3">
                        <Text
                          size="small"
                          weight="plus"
                          leading="compact"
                          className="w-24 shrink-0 capitalize"
                        >
                          {platform}
                        </Text>
                        <Text
                          size="small"
                          className="text-ui-fg-subtle break-all"
                        >
                          {url}
                        </Text>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <Text size="small" className="text-ui-fg-subtle">
                  {t("store.details.noSocialLinks")}
                </Text>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
});
