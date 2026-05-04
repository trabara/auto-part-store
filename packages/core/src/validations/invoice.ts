import { BASE_MASK } from "../schemas";
import { InvoiceConfigSchema } from "../schemas/invoice";

export const CreateInvoiceConfigSchema: any = InvoiceConfigSchema.omit(BASE_MASK);
