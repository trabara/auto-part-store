import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { resolveCustomerStep } from "./steps/resolve-customer";
import { linkAuthIdentityToCustomerStep } from "./steps/link-auth-identity-to-customer";
import { updateCustomerAccountStep } from "./steps/update-customer-account";

type Input = {
  email: string;
  auth_identity_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};

export const registerCustomerWorkflow = createWorkflow(
  "register-customer",
  function (input: Input) {
    const { customer } = resolveCustomerStep({
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
    });

    const linkInput = transform({ customer, input }, ({ customer, input }) => ({
      auth_identity_id: input.auth_identity_id,
      customer_id: customer.id,
    }));

    linkAuthIdentityToCustomerStep(linkInput);

    const updateInput = transform(
      { customer, input },
      ({ customer, input }) => ({
        customer_id: customer.id,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
      }),
    );

    const updatedCustomer = updateCustomerAccountStep(updateInput);

    return new WorkflowResponse(updatedCustomer);
  },
);
