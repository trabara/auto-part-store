import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { MedusaError } from "@medusajs/framework/utils";
import type { ICustomerModuleService } from "@medusajs/framework/types";

type Input = {
  email: string;
};

export const findCustomerByEmailStep = createStep(
  "find-customer-by-email",
  async (input: Input, { container }) => {
    const customerModule = container.resolve<ICustomerModuleService>(
      Modules.CUSTOMER,
    );

    const [customer] = await customerModule.listCustomers({
      email: input.email,
    });

    if (!customer) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No customer found with email ${input.email}`,
      );
    }

    if (customer.has_account) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "An account already exists with this email",
      );
    }

    return new StepResponse(customer);
  });
