import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";
import { Button, Container, Heading, Text, toast } from "@medusajs/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sdk } from "../lib/sdk";

const OrderInvoiceWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { t } = useTranslation();

  const downloadInvoice = async () => {
    setIsDownloading(true);

    try {
      const response: Response = await sdk.client.fetch(
        `/admin/orders/${order.id}/invoices`,
        {
          method: "GET",
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
      toast.success(t("invoices.widget.success"));
    } catch (error) {
      toast.error(t("invoices.widget.error", { error }));
      setIsDownloading(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">{t("invoices.widget.header")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("invoices.widget.description")}
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
          {t("invoices.widget.action")}
        </Button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
});

export default OrderInvoiceWidget;