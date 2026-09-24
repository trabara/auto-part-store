import { html } from "@codemirror/lang-html";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminFile } from "@medusajs/framework/types";
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
// import { AvatarUpload } from "@repo/ui/components/avatar-upload";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreateInvoiceConfig, InvoiceConfig } from "@trabara/core/dtos";
import { CreateInvoiceConfigSchema } from '@trabara/core/validations';
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import CodeMirror from "@uiw/react-codemirror";
import Handlebars from "handlebars";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { sdk } from "../../../../lib/sdk";
import { SAMPLE_DATA } from "../constant";

export const InvoiceGeneratorForm = () => {
  const { t } = useTranslation();
  const logoFileRef = useRef<AdminFile | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");

  const { data: { invoice_config } = {}, isLoading, refetch } = useQuery<{
    invoice_config?: InvoiceConfig;
  }>({
    queryFn: () => sdk.client.fetch("/admin/invoice-config"),
    queryKey: ["invoice-config"],
  });
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: CreateInvoiceConfig) =>
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

  const getFormDefaultValues = useCallback(() => ({
    company_name: invoice_config?.company_name || "",
    company_address: invoice_config?.company_address || "",
    company_phone: invoice_config?.company_phone || "",
    company_email: invoice_config?.company_email || "",
    company_logo: invoice_config?.company_logo || "",
    notes: invoice_config?.notes || "",
    template: invoice_config?.template || "",
  }), [invoice_config]);

  const form = useForm<CreateInvoiceConfig>({
    resolver: zodResolver(CreateInvoiceConfigSchema),
    defaultValues: getFormDefaultValues(),
  });

  const handleSubmit = form.handleSubmit((formData) => mutateAsync(formData));

  // const uploadLogo = useCallback(
  //   async (files: File[]) => {
  //     // If there's already an uploaded logo file that hasn't been saved, delete it before uploading a new one
  //     if (!logoFileRef.current) {
  //       const { files: uploadedFiles } = await sdk.admin.upload.create({
  //         files: [files[0]],
  //       });
  //       logoFileRef.current = uploadedFiles[0];
  //       form.setValue("company_logo", uploadedFiles[0].url);
  //     }
  //   },
  //   [form],
  // );

  const generatePreview = useCallback(() => {
    const invoiceConfig = form.getValues();
    if (!invoiceConfig.template) {
      setPreviewHtml("<p>No template defined</p>");
      return;
    }

    const locale = localStorage.getItem("lng") || "en";

    try {
      const sampleData = {
        ...SAMPLE_DATA,
        dir: locale === "ar" ? "rtl" : "ltr",
        isRtl: locale === "ar",
        companyName: invoiceConfig.company_name || SAMPLE_DATA.companyName,
        companyAddress:
          invoiceConfig.company_address || SAMPLE_DATA.companyAddress,
        companyPhone:
          invoiceConfig.company_phone || SAMPLE_DATA.companyPhone,
        companyEmail:
          invoiceConfig.company_email || SAMPLE_DATA.companyEmail,
        companyLogo: invoiceConfig.company_logo || SAMPLE_DATA.companyLogo,
        notes: invoiceConfig.notes || SAMPLE_DATA.notes,
        t: {
          invoice: t("invoice.template.invoice"),
          date: t("invoice.template.date"),
          due: t("invoice.template.due"),
          billTo: t("invoice.template.billTo"),
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
        },
      };

      const compiled = Handlebars.compile(invoiceConfig.template);
      const html_ = compiled(sampleData);
      setPreviewHtml(html_);
    } catch (error) {
      console.error("Template compilation error:", error);
      setPreviewHtml(
        `<p style="color: red;">Template error: ${error instanceof Error ? error.message : "Unknown error"}</p>`,
      );
    }
  }, [form]);


  useEffect(() => {
    form.reset(getFormDefaultValues());
  }, [getFormDefaultValues]);

  const formValues = form.watch();
  useEffect(() => {
    if (formValues.template) {
      generatePreview();
    }
  }, [formValues, generatePreview]);

  useEffect(() => {
    return () => {
      if (!form.formState.isSubmitted && logoFileRef.current) {
        sdk.admin.upload
          .delete(logoFileRef.current.id)
          .then(() => {
            console.log("Unused logo file deleted");
          })
          .catch((error) => {
            console.error("Error deleting unused logo file:", error);
          })
          .finally(() => {
            logoFileRef.current = null;
          });
      }
    };
  }, [form]);

  return (
    <FormProvider {...form}>
      <Container className="divide-y p-0">
        <form onSubmit={handleSubmit} className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h1"> {t("invoice.page.title")}</Heading>
            <Button type="submit" disabled={isLoading || isPending}>
              {t("common.save")}
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              <Controller
                control={form.control}
                name="company_logo"
                render={({ fieldState: { error } }) => {
                  return (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-x-1">
                        <Label size="small" weight="plus">
                          {t("invoice.field.companyLogo")}
                        </Label>
                      </div>
                      {/* <AvatarUpload className="w-24" onValueChange={uploadLogo} value={field.value} /> */}
                      {error && (
                        <Hint variant="error">{error.message}</Hint>
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
                          {t("invoice.field.companyName")}
                        </Label>
                      </div>
                      <Input
                        {...field}
                        onChange={field.onChange}
                        value={field.value}
                      />
                      {error && (
                        <Hint variant="error">{error.message}</Hint>
                      )}
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
                          {t("invoice.field.companyAddress")}
                        </Label>
                      </div>
                      <Textarea {...field} />
                      {error && (
                        <Hint variant="error">{error.message}</Hint>
                      )}
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
                          {t("invoice.field.companyPhone")}
                        </Label>
                      </div>
                      <Input {...field} />
                      {error && (
                        <Hint variant="error">{error.message}</Hint>
                      )}
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
                          {t("invoice.field.companyEmail")}
                        </Label>
                      </div>
                      <Input {...field} />
                      {error && (
                        <Hint variant="error">{error.message}</Hint>
                      )}
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
                          {t("invoice.field.notes")}
                        </Label>
                      </div>
                      <Textarea {...field} />
                      {error && (
                        <Hint variant="error">{error.message}</Hint>
                      )}
                    </div>
                  );
                }}
              />

              <Controller
                control={form.control}
                name="template"
                render={({ field, fieldState: { error } }) => {
                  return (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-x-1">
                        <Label size="small" weight="plus">
                          {t("invoice.field.template")}
                        </Label>
                      </div>
                      {/* <CodeMirror
                        {...field}
                        height="400px"
                        theme={vscodeDark}
                        style={{ fontSize: 12 }}
                        extensions={[html()]}
                      /> */}
                      {error && (
                        <Hint variant="error">{error.message}</Hint>
                      )}
                    </div>
                  );
                }}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between gap-x-1">
                <Label size="small" weight="plus">
                  {t("invoice.preview.title")}
                </Label>
              </div>
              <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50">
                <iframe
                  srcDoc={previewHtml}
                  className="aspect-[1/1.414]"
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
