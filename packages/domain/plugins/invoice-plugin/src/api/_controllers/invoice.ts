import { BaseController } from "@trabara/common";
import { CreateInvoiceConfigSchema } from "@trabara/core";
import { updateInvoiceConfigWorkflow } from "../../workflows/invoice-generator";
import { createInvoiceConfigWorkflow } from "../../workflows/invoice-generator/create-invoice-config";

/**
 * Invoice Controller
 *
 * Handles all invoice-related HTTP requests.
 * Following SRP: Single responsibility is handling invoice HTTP requests.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class InvoiceController extends BaseController {
  public async getConfig(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve("query");

      const {
        data: [invoice_config],
      } = await query.graph({
        entity: "invoice_config",
        fields: ["*"],
      });

      this.success({ invoice_config });
    }, "Invoice configuration retrieved successfully");
  }

  public async upsertConfig(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const input = CreateInvoiceConfigSchema.parse(this.req.validatedBody);

      if (id) {
        const { result: invoice_config } = await updateInvoiceConfigWorkflow(
          this.req.scope,
        ).run({
          input: { id, ...input },
        });

        this.success({ invoice_config });
        return;
      }

      const { result: invoice_config } = await createInvoiceConfigWorkflow(
        this.req.scope,
      ).run({
        input,
      });
      this.success({ invoice_config });

    }, "Invoice configuration updated successfully");
  }
}
