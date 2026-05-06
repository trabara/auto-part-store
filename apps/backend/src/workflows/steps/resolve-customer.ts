import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules, MedusaError } from "@medusajs/framework/utils";
import type {
  ICustomerModuleService,
  CustomerDTO,
} from "@medusajs/framework/types";

type Input = {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};

type Output = {
  customer: CustomerDTO;
  was_created: boolean;
};

type Compensation = {
  customer_id: string;
  was_created: boolean;
};

export const resolveCustomerStep = createStep<Input, Output, Compensation>(
  "resolve-customer",
  async (input: Input, { container }) => {
    const customerModule = container.resolve<ICustomerModuleService>(
      Modules.CUSTOMER,
    );

    const [existing] = await customerModule.listCustomers({
      email: input.email,
    });

    if (existing?.has_account) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "An account already exists with this email",
      );
    }

    if (existing) {
      // Guest customer — return as-is; the account will be activated later
      return new StepResponse(
        { customer: existing, was_created: false },
        { customer_id: existing.id, was_created: false },
      );
    }

    // Brand-new email — create the customer record
    const customer = await customerModule.createCustomers({
      email: input.email,
      first_name: input.first_name ?? null,
      last_name: input.last_name ?? null,
      phone: input.phone ?? null,
    });

    return new StepResponse(
      { customer, was_created: true },
      { customer_id: customer.id, was_created: true },
    );
  },
  async (compensation: Compensation, { container }) => {
    if (!compensation?.was_created) return;

    const customerModule = container.resolve<ICustomerModuleService>(
      Modules.CUSTOMER,
    );
    await customerModule.deleteCustomers([compensation.customer_id]);
  },
);
