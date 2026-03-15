'use client'

import { sdk } from '@/lib/config'
import { StoreOrder } from '@medusajs/types'
import { Button } from '@repo/ui/components/button'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface InvoiceDownloadButtonProps {
    order: StoreOrder
}

export default function InvoiceButton({ order }: InvoiceDownloadButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const t = useTranslations('order')

    const downloadInvoice = async () => {
        setIsDownloading(true)
        const locale = localStorage.getItem('lng') ?? 'en'

        try {
            const response: Response = await sdk.client.fetch(
                `/store/orders/${order.id}/invoices?locale=${locale}`,
                {
                    method: "GET",
                    headers: {
                        "accept": "application/pdf",
                    },
                }
            )

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `invoice-${order.id}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            setIsDownloading(false)
            // toast.success("Invoice generated and downloaded successfully")
        } catch (error) {
            // toast.error(`Failed to generate invoice: ${error}`)
            setIsDownloading(false)
        }
    }

    return (
        <Button variant='link' onClick={downloadInvoice} disabled={isDownloading}>
            {isDownloading ? t('downloadingInvoice') : t('downloadInvoice')}
        </Button>
    )
}
