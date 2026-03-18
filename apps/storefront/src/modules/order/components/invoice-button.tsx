"use client"

import { sdk } from "@/lib/config"
import { StoreOrder } from "@medusajs/types"
import { Button } from "@repo/ui/components/button"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"

interface InvoiceDownloadButtonProps {
  order: StoreOrder
}

export default function InvoiceButton({ order }: InvoiceDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const t = useTranslations("order")
  const locale = useLocale()

  const downloadInvoice = async () => {
    setIsDownloading(true)

    try {
      const response: Response = await sdk.client.fetch(`/store/orders/${order.id}/invoices`, {
        method: "GET",
        query: {
          locale,
        },
        headers: {
          accept: "application/pdf",
        },
      })

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = `invoice-${order.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(objectUrl)
      document.body.removeChild(a)
      setIsDownloading(false)
      // toast.success("Invoice generated and downloaded successfully")
    } catch {
      // toast.error(`Failed to generate invoice: ${error}`)
      setIsDownloading(false)
    }
  }

  return (
    <Button variant="link" onClick={downloadInvoice} disabled={isDownloading}>
      {isDownloading ? t("downloadingInvoice") : t("downloadInvoice")}
    </Button>
  )
}
