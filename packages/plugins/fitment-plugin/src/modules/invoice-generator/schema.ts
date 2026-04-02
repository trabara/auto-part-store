import { z } from "@medusajs/framework/zod"

export const InvoiceConfigSchema = z.object({
    id: z.string(),
    company_name: z.string().min(1, "Company name is required"),
    company_address: z.string().min(1, "Company address is required"),
    company_phone: z.string().min(1, "Company phone is required"),
    company_email: z.string().email("Invalid email address"),
    company_logo: z.string().optional(),
    notes: z.string().optional(),
    template: z.string()
})

export type InvoiceConfig = z.infer<typeof InvoiceConfigSchema>

export const PostInvoiceConfigSchema = InvoiceConfigSchema.omit({ id: true })

export type PostInvoiceConfig = z.infer<typeof PostInvoiceConfigSchema>
