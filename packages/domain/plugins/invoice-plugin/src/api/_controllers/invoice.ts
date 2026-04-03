import { BaseController } from "@trabara/common";
import { PostInvoiceConfig } from "@trabara/core/dtos";
import { updateInvoiceConfigWorkflow } from "../../workflows/invoice-generator";

/**
 * Invoice Controller
 *
 * Handles all invoice-related HTTP requests.
 * Following SRP: Single responsibility is handling invoice HTTP requests.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class InvoiceController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  public async getConfig(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve("query");

      const {
        data: [invoiceConfig],
      } = await query.graph({
        entity: "invoice_config",
        fields: ["*"],
      });

      this.success({ invoice_config: invoiceConfig });
    }, "Invoice configuration retrieved successfully");
  }

  public async updateConfig(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const { result: invoice_config } = await updateInvoiceConfigWorkflow(
        this.req.scope,
      ).run({
        input: this.req.validatedBody as PostInvoiceConfig,
      });

      this.success({ invoice_config });
    }, "Invoice configuration updated successfully");
  }
}
