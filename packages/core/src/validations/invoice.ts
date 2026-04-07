import { BASE_MASK } from "../schemas";
import { InvoiceConfigSchema } from "../schemas/invoice";

export const CreateInvoiceConfigSchema = InvoiceConfigSchema.omit(BASE_MASK);
