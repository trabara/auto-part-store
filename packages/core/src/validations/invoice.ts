import { InvoiceConfigSchema } from "../schemas/invoice";

export const PostInvoiceConfigSchema = InvoiceConfigSchema.omit({ id: true });
