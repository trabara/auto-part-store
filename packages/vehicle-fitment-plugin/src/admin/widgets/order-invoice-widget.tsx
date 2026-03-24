import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";
import { Button, Container, Heading, Text, toast } from "@medusajs/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sdk } from "../lib/sdk";

const OrderInvoiceWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadInvoice = async () => {
    setIsDownloading(true);
    const locale = localStorage.getItem("lng") ?? 'en';

    try {
      const response: Response = await sdk.client.fetch(
        `/admin/orders/${order.id}/invoices`,
        {
          method: "GET",
          query: {
            locale
          },
          headers: {
            accept: "application/pdf",
          },
        },
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsDownloading(false);
      toast.success(t("invoice.widget.toast.success"));
    } catch (error) {
      toast.error(t("invoice.widget.toast.error"));
      setIsDownloading(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">{t("invoice.widget.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("invoice.widget.subtitle")}
          </Text>
        </div>
      </div>

      <div className="flex items-center justify-end px-6 py-4">
        <Button
          variant="secondary"
          disabled={isDownloading}
          onClick={downloadInvoice}
          isLoading={isDownloading}
        >
          {t("invoice.widget.download")}
        </Button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
});

export default OrderInvoiceWidget;
