import type { ICustomerModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

type Input = {
  customer_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};


export const updateCustomerAccountStep = createStep(
  "update-customer-account",
  async (input: Input, { container }) => {
    const customerModule = container.resolve<ICustomerModuleService>(
      Modules.CUSTOMER,
    );

    const [existing] = await customerModule.listCustomers({
      id: input.customer_id,
    });

    const updateData: Record<string, unknown> = {
      has_account: true,
    };
    if (input.first_name !== undefined)
      updateData.first_name = input.first_name;
    if (input.last_name !== undefined) updateData.last_name = input.last_name;
    if (input.phone !== undefined) updateData.phone = input.phone;

    const updated = await (customerModule as any).updateCustomers(
      input.customer_id,
      updateData,
    );

    return new StepResponse(updated, {
      customer_id: input.customer_id,
      original_has_account: existing?.has_account ?? false,
    });
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return;
    }

    const customerModule = container.resolve<ICustomerModuleService>(
      Modules.CUSTOMER,
    );

    await (customerModule as any).updateCustomers(
      compensation.customer_id,
      { has_account: compensation.original_has_account },
    );
  },
);
