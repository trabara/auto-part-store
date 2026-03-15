import { html } from "@codemirror/lang-html";
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Textarea,
  toast
} from "@medusajs/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import CodeMirror from "@uiw/react-codemirror";
import Handlebars from "handlebars";
import { useCallback, useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  InvoiceConfig,
  PostInvoiceConfig,
} from "../../..//modules/invoice-generator/schema";
import { sdk } from "../../lib/sdk";
import { SAMPLE_DATA } from "./constant";



export const InvoiceGenerator = () => {
  const { t } = useTranslation();

  const [previewHtml, setPreviewHtml] = useState("");
  const { data, isLoading, refetch } = useQuery<{
    invoice_config: InvoiceConfig;
  }>({
    queryFn: () => sdk.client.fetch("/admin/invoice-config"),
    queryKey: ["invoice-config"],
  });
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: PostInvoiceConfig) =>
      sdk.client.fetch("/admin/invoice-config", {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      refetch();
      toast.success(t("invoice.toast.saved"));
    },
    onError: () => {
      toast.error(t("invoice.toast.error"));
    },
  });

  const getFormDefaultValues = useCallback(() => {
    return {
      company_name: data?.invoice_config.company_name || "",
      company_address: data?.invoice_config.company_address || "",
      company_phone: data?.invoice_config.company_phone || "",
      company_email: data?.invoice_config.company_email || "",
      company_logo: data?.invoice_config.company_logo || "",
      notes: data?.invoice_config.notes || "",
      template: data?.invoice_config.template || "",
    };
  }, [data]);

  const form = useForm<PostInvoiceConfig>({
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

  const generatePreview = useCallback(() => {
    const template = form.getValues("template");
    if (!template) {
      setPreviewHtml("<p>No template defined</p>");
      return;
    }

    const locale = localStorage.getItem('lng') || 'en';

    try {
      const sampleData = {
        ...SAMPLE_DATA,
        dir: locale === "ar" ? "rtl" : "ltr",
        isRtl: locale === "ar",
        companyName: form.getValues("company_name") || SAMPLE_DATA.companyName,
        companyAddress:
          form.getValues("company_address") || SAMPLE_DATA.companyAddress,
        companyPhone:
          form.getValues("company_phone") || SAMPLE_DATA.companyPhone,
        companyEmail:
          form.getValues("company_email") || SAMPLE_DATA.companyEmail,
        companyLogo: form.getValues("company_logo") || SAMPLE_DATA.companyLogo,
        notes: form.getValues("notes") || SAMPLE_DATA.notes,
        t: {
          invoice: t("invoice.template.invoice"),
          date: t("invoice.template.date"),
          due: t("invoice.template.due"),
          billTo: t("invoice.template.billTo"),
          item: t("invoice.template.item"),
          description: t("invoice.template.description"),
          quantity: t("invoice.template.quantity"),
          unitPrice: t("invoice.template.unitPrice"),
          total: t("invoice.template.total"),
          subtotal: t("invoice.template.subtotal"),
          tax: t("invoice.template.tax"),
          taxRate: t("invoice.template.taxRate"),
          shipping: t("invoice.template.shipping"),
          grandTotal: t("invoice.template.grandTotal"),
          notes: t("invoice.template.notes"),
          discount: t("invoice.template.discount"),
        }
      };

      const compiled = Handlebars.compile(template);
      const html_ = compiled(sampleData);
      setPreviewHtml(html_);
    } catch (error) {
      console.error("Template compilation error:", error);
      setPreviewHtml(
        `<p style="color: red;">Template error: ${error instanceof Error ? error.message : "Unknown error"}</p>`,
      );
    }
  }, [form]);

  const formValues = form.watch();

  useEffect(() => {
    form.reset(getFormDefaultValues());
  }, [getFormDefaultValues]);

  useEffect(() => {
    if (formValues.template) {
      generatePreview();
    }
  }, [formValues, generatePreview]);

  return (
    <FormProvider {...form}>
      <Container className="divide-y p-0">
        <form onSubmit={handleSubmit} className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h1"> {t("invoice.page.title")} </Heading>
            <Button type="submit" disabled={isLoading || isPending}>
              {t("common.save")}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              <Controller
                control={form.control}
                name="company_logo"
                render={({ field }) => {
                  return (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-x-1">
                        <Label size="small" weight="plus">
                          {t("invoice.field.companyLogo")}
                        </Label>
                      </div>
                      <Input
                        type="file"
                        onChange={uploadLogo}
                        className="py-1"
                      />
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
                render={({ field }) => {
                  return (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-x-1">
                        <Label size="small" weight="plus">
                          {t("invoice.field.companyName")}
                        </Label>
                      </div>
                      <Input
                        {...field}
                        onChange={field.onChange}
                        value={field.value}
                      />
                    </div>
                  );
                }}
              />
              <Controller
                control={form.control}
                name="company_address"
                render={({ field }) => {
                  return (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-x-1">
                        <Label size="small" weight="plus">
                          {t("invoice.field.companyAddress")}
                        </Label>
                      </div>
                      <Textarea {...field} />
                    </div>
                  );
                }}
              />
              <Controller
                control={form.control}
                name="company_phone"
                render={({ field }) => {
                  return (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-x-1">
                        <Label size="small" weight="plus">
                          {t("invoice.field.companyPhone")}
                        </Label>
                      </div>
                      <Input {...field} />
                    </div>
                  );
                }}
              />
              <Controller
                control={form.control}
                name="company_email"
                render={({ field }) => {
                  return (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-x-1">
                        <Label size="small" weight="plus">
                          {t("invoice.field.companyEmail")}
                        </Label>
                      </div>
                      <Input {...field} />
                    </div>
                  );
                }}
              />
              <Controller
                control={form.control}
                name="notes"
                render={({ field }) => {
                  return (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-x-1">
                        <Label size="small" weight="plus">
                          {t("invoice.field.notes")}
                        </Label>
                      </div>
                      <Textarea {...field} />
                    </div>
                  );
                }}
              />

              <Controller
                control={form.control}
                name="template"
                render={({ field }) => {
                  return (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-x-1">
                        <Label size="small" weight="plus">
                          {t("invoice.field.template")}
                        </Label>
                      </div>
                      <CodeMirror
                        {...field}
                        theme={vscodeDark}
                        extensions={[html()]}
                        height="400px"
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  );
                }}
              />
            </div>

            <div className="flex flex-col space-y-2 min-h-[]">
              <div className="flex items-center justify-between gap-x-1">
                <Label size="small" weight="plus">
                  {t("invoice.preview.title")}
                </Label>
              </div>
              <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full"
                  title="Invoice Preview"
                />
              </div>
            </div>
          </div>
        </form>
      </Container>
    </FormProvider>
  );
};
