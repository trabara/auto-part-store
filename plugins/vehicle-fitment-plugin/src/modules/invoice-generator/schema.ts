import { z } from "@medusajs/framework/zod"

export const InvoiceConfigSchema = z.object({
    id: z.string(),
    company_name: z.string().optional(),
    company_address: z.string().optional(),
    company_phone: z.string().optional(),
    company_email: z.string().optional(),
    company_logo: z.string().optional(),
    notes: z.string().optional(),
    template: z.string()
})

export type InvoiceConfig = z.infer<typeof InvoiceConfigSchema>

export const PostInvoiceConfigSchema = InvoiceConfigSchema.omit({ id: true })

export type PostInvoiceConfig = z.infer<typeof PostInvoiceConfigSchema>
