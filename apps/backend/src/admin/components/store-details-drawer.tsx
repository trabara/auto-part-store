"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "@medusajs/icons";
import {
  Button,
  Drawer,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";
import { sdk } from "@repo/admin/lib/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const makeSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("store.drawer.storeNameRequired")),
    address: z.string().optional(),
    map_url: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.startsWith("http"),
        t("store.drawer.invalidUrl"),
      ),
    contact_emails: z.array(
      z.object({
        value: z
          .string()
          .email(t("store.drawer.invalidEmail"))
          .or(z.literal("")),
      }),
    ),
    contact_phone_numbers: z.array(
      z.object({
        value: z.string(),
      }),
    ),
    social_links: z.array(
      z.object({
        platform: z.string(),
        url: z
          .string()
          .optional()
          .refine(
            (val) => !val || val.startsWith("http"),
            t("store.drawer.invalidUrl"),
          ),
      }),
    ),
  });

type StoreDetailsFormData = {
  name: string;
  address?: string;
  map_url?: string;
  contact_emails: { value: string }[];
  contact_phone_numbers: { value: string }[];
  social_links: { platform: string; url?: string }[];
};

type StoreDetailsDrawerProps = {
  open: boolean;
  current: {
    name?: string;
    address?: string | null;
    map_url?: string | null;
    contact_emails?: string[] | null;
    contact_phone_numbers?: string[] | null;
    social_links?: Record<string, string> | null;
  } | null;
  onOpenChange: (open: boolean) => void;
};

export function StoreDetailsDrawer({
  current,
  open,
  onOpenChange,
}: StoreDetailsDrawerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const schema = makeSchema(t);

  const defaultValues = (): StoreDetailsFormData => ({
    name: current?.name ?? "",
    address: current?.address ?? "",
    map_url: current?.map_url ?? "",
    contact_emails: (current?.contact_emails ?? []).map((v) => ({ value: v })),
    contact_phone_numbers: (current?.contact_phone_numbers ?? []).map((v) => ({
      value: v,
    })),
    social_links: current?.social_links
      ? Object.entries(current.social_links).map(([platform, url]) => ({
          platform,
          url,
        }))
      : [],
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreDetailsFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(),
  });

  const emails = useFieldArray({ control, name: "contact_emails" });
  const phones = useFieldArray({ control, name: "contact_phone_numbers" });
  const socials = useFieldArray({ control, name: "social_links" });

  const mutation = useMutation({
    mutationFn: (data: StoreDetailsFormData) => {
      const social_links =
        data.social_links.length > 0
          ? Object.fromEntries(
              data.social_links
                .filter((s) => s.platform.trim() && s.url?.trim())
                .map((s) => [s.platform.trim(), s.url!.trim()]),
            )
          : null;

      const contact_emails = data.contact_emails
        .map((e) => e.value)
        .filter(Boolean);
      const contact_phone_numbers = data.contact_phone_numbers
        .map((p) => p.value)
        .filter(Boolean);

      return sdk.client.fetch("/admin/stores/details", {
        method: "POST",
        body: {
          name: data.name || undefined,
          address: data.address || null,
          map_url: data.map_url || null,
          contact_emails: contact_emails.length > 0 ? contact_emails : null,
          contact_phone_numbers:
            contact_phone_numbers.length > 0 ? contact_phone_numbers : null,
          social_links,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-details"] });
      toast.success(t("store.drawer.saveSuccess"));
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("store.drawer.saveError"));
    },
  });

  const handleOpen = () => {
    reset(defaultValues());
    onOpenChange(true);
  };

  const onSubmit = (data: StoreDetailsFormData) => mutation.mutate(data);

  return (
    <Drawer open={open} onOpenChange={handleOpen}>
      <Drawer.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="contents">
          <Drawer.Header>
            <Drawer.Title>{t("store.drawer.title")}</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto p-6">
            {/* Name */}
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="name">{t("store.drawer.storeName")}</Label>
              <Input id="name" {...register("name")} placeholder="My Store" />
              {errors.name && (
                <Text size="small" className="text-ui-fg-error">
                  {errors.name.message}
                </Text>
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="address">{t("store.drawer.address")}</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="123 Main St, City, Country"
                rows={3}
              />
            </div>

            {/* Map URL */}
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="map_url">{t("store.drawer.mapEmbedUrl")}</Label>
              <Input
                id="map_url"
                {...register("map_url")}
                placeholder="https://maps.google.com/embed?..."
              />
              {errors.map_url && (
                <Text size="small" className="text-ui-fg-error">
                  {errors.map_url.message}
                </Text>
              )}
            </div>

            {/* Contact Emails */}
            <div className="flex flex-col gap-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("store.drawer.contactEmails")}</Label>
                <Button
                  size="small"
                  variant="transparent"
                  type="button"
                  onClick={() => emails.append({ value: "" })}
                >
                  <Plus />
                  {t("store.drawer.add")}
                </Button>
              </div>
              <div className="flex flex-col gap-y-2">
                {emails.fields.map((field, i) => (
                  <div key={field.id} className="flex flex-col gap-y-1">
                    <div className="flex items-center gap-x-2">
                      <Input
                        className="flex-1"
                        {...register(`contact_emails.${i}.value`)}
                        placeholder="contact@example.com"
                        type="email"
                      />
                      <Button
                        size="small"
                        variant="transparent"
                        type="button"
                        onClick={() => emails.remove(i)}
                      >
                        <Trash className="text-ui-fg-subtle" />
                      </Button>
                    </div>
                    {errors.contact_emails?.[i]?.value && (
                      <Text size="small" className="text-ui-fg-error">
                        {errors.contact_emails[i]?.value?.message}
                      </Text>
                    )}
                  </div>
                ))}
                {emails.fields.length === 0 && (
                  <Text size="small" className="text-ui-fg-muted">
                    {t("store.drawer.noEmails")}
                  </Text>
                )}
              </div>
            </div>

            {/* Contact Phones */}
            <div className="flex flex-col gap-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("store.drawer.contactPhones")}</Label>
                <Button
                  size="small"
                  variant="transparent"
                  type="button"
                  onClick={() => phones.append({ value: "" })}
                >
                  <Plus />
                  {t("store.drawer.add")}
                </Button>
              </div>
              <div className="flex flex-col gap-y-2">
                {phones.fields.map((field, i) => (
                  <div key={field.id} className="flex items-center gap-x-2">
                    <Input
                      className="flex-1"
                      {...register(`contact_phone_numbers.${i}.value`)}
                      placeholder="+1 234 567 8900"
                      type="tel"
                    />
                    <Button
                      size="small"
                      variant="transparent"
                      type="button"
                      onClick={() => phones.remove(i)}
                    >
                      <Trash className="text-ui-fg-subtle" />
                    </Button>
                  </div>
                ))}
                {phones.fields.length === 0 && (
                  <Text size="small" className="text-ui-fg-muted">
                    {t("store.drawer.noPhones")}
                  </Text>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-col gap-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("store.drawer.socialLinks")}</Label>
                <Button
                  size="small"
                  variant="transparent"
                  type="button"
                  onClick={() => socials.append({ platform: "", url: "" })}
                >
                  <Plus />
                  {t("store.drawer.add")}
                </Button>
              </div>
              <div className="flex flex-col gap-y-2">
                {socials.fields.map((field, i) => (
                  <div key={field.id} className="flex flex-col gap-y-1">
                    <div className="flex items-center gap-x-2">
                      <Input
                        className="w-32 shrink-0"
                        {...register(`social_links.${i}.platform`)}
                        placeholder="facebook"
                      />
                      <Input
                        className="flex-1"
                        {...register(`social_links.${i}.url`)}
                        placeholder="https://facebook.com/..."
                      />
                      <Button
                        size="small"
                        variant="transparent"
                        type="button"
                        onClick={() => socials.remove(i)}
                      >
                        <Trash className="text-ui-fg-subtle" />
                      </Button>
                    </div>
                    {errors.social_links?.[i]?.url && (
                      <Text size="small" className="text-ui-fg-error">
                        {errors.social_links[i]?.url?.message}
                      </Text>
                    )}
                  </div>
                ))}
                {socials.fields.length === 0 && (
                  <Text size="small" className="text-ui-fg-muted">
                    {t("store.drawer.noSocialLinks")}
                  </Text>
                )}
              </div>
            </div>
          </Drawer.Body>

          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  disabled={mutation.isPending}
                >
                  {t("store.drawer.cancel")}
                </Button>
              </Drawer.Close>
              <Button size="small" type="submit" isLoading={mutation.isPending}>
                {t("store.drawer.save")}
              </Button>
            </div>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
}
