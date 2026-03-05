import { zodResolver } from "@hookform/resolvers/zod";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  Heading,
  Hint,
  Input,
  Label,
  Textarea,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodSchemaWithTranslations } from "../../../../lib/zod";
import {
  CreateInvoiceConfigSchema,
  InvoiceConfigDTO,
} from "../../../../modules/invoice-gen/dtos";
import { sdk } from "../../../lib/sdk";

const InvoiceConfigPage = () => {
  const { t } = useTranslation();

  const { data, isLoading, refetch } = useQuery<{
    invoice_config: InvoiceConfigDTO;
  }>({
    queryFn: () => sdk.client.fetch("/admin/invoice-config"),
    queryKey: ["invoice-config"],
  });
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: InvoiceConfigDTO) =>
      sdk.client.fetch("/admin/invoice-config", {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      refetch();
      toast.success(t("invoices.config.toasts.success"));
    },
    onError: () => {
      toast.error(t("invoices.config.toasts.error"));
    },
  });

  const getFormDefaultValues = useCallback(() => {
    return {
      company_name: data?.invoice_config.company_name,
      company_address: data?.invoice_config.company_address,
      company_phone: data?.invoice_config.company_phone,
      company_email: data?.invoice_config.company_email,
      company_logo: data?.invoice_config.company_logo,
      notes: data?.invoice_config.notes,
      template_id: data?.invoice_config.template_id,
    };
  }, [data]);

  const schema = zodSchemaWithTranslations(CreateInvoiceConfigSchema, {
    company_name: t("invoices.config.fields.company_name.validation.required"),
    company_address: t(
      "invoices.config.fields.company_address.validation.required",
    ),
    company_phone: t(
      "invoices.config.fields.company_phone.validation.required",
    ),
    company_email: t(
      "invoices.config.fields.company_email.validation.required",
    ),
  });

  const form = useForm<InvoiceConfigDTO>({
    resolver: zodResolver(schema) as any,
    defaultValues: getFormDefaultValues(),
  });

  const handleSubmit = form.handleSubmit((formData) => mutateAsync(formData));

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const { files } = await sdk.admin.upload.create({
      files: [file],
    });

    form.setValue("company_logo", files[0].url);
  };

  useEffect(() => {
    form.reset(getFormDefaultValues());
  }, [getFormDefaultValues]);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">{t("invoices.title")}</Heading>
      </div>
      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit}
          className="flex h-full flex-col overflow-hidden p-6 gap-2"
        >
          <div className="flex flex-col space-y-2">
            <Controller
              control={form.control}
              name="company_logo"
              render={({ field }) => {
                return (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-x-1">
                      <Label size="small" weight="plus">
                        {t("invoices.config.fields.company_logo.label")}
                      </Label>
                    </div>
                    <Input type="file" onChange={uploadLogo} className="py-1" />
                    {field.value && (
                      <img
                        src={field.value}
                        alt="Company Logo"
                        className="mt-2 h-24 w-24"
                      />
                    )}
                  </div>
                );
              }}
            />
            <Controller
              control={form.control}
              name="company_name"
              render={({ field, fieldState: { error } }) => {
                return (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-x-1">
                      <Label size="small" weight="plus">
                        {t("invoices.config.fields.company_name.label")}
                      </Label>
                    </div>
                    <Input
                      {...field}
                      onChange={field.onChange}
                      value={field.value}
                    />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                );
              }}
            />
            <Controller
              control={form.control}
              name="company_address"
              render={({ field, fieldState: { error } }) => {
                return (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-x-1">
                      <Label size="small" weight="plus">
                        {t("invoices.config.fields.company_address.label")}
                      </Label>
                    </div>
                    <Textarea {...field} />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                );
              }}
            />
            <Controller
              control={form.control}
              name="company_phone"
              render={({ field, fieldState: { error } }) => {
                return (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-x-1">
                      <Label size="small" weight="plus">
                        {t("invoices.config.fields.company_phone.label")}
                      </Label>
                    </div>
                    <Input {...field} />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                );
              }}
            />
            <Controller
              control={form.control}
              name="company_email"
              render={({ field, fieldState: { error } }) => {
                return (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-x-1">
                      <Label size="small" weight="plus">
                        {t("invoices.config.fields.company_email.label")}
                      </Label>
                    </div>
                    <Input {...field} />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                );
              }}
            />
            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState: { error } }) => {
                return (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-x-1">
                      <Label size="small" weight="plus">
                        {t("invoices.config.fields.notes.label")}
                      </Label>
                    </div>
                    <Textarea {...field} />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                );
              }}
            />

            <Controller
              control={form.control}
              name="template_id"
              render={({ field, fieldState: { error } }) => {
                return (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-x-1">
                      <Label size="small" weight="plus">
                        {t("invoices.config.fields.template_id.label")}
                      </Label>
                    </div>
                    <Input
                      {...field}
                      onChange={field.onChange}
                      value={field.value}
                    />
                    {error && <Hint variant="error">{error.message}</Hint>}
                  </div>
                );
              }}
            />
          </div>
          <div className="border-t mt-6 pt-4 flex justify-end">
            <Button type="submit" disabled={isLoading || isPending}>
              {t("invoices.config.buttons.save")}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "invoices.title",
  translationNs: "invoices",
});

export default InvoiceConfigPage;