import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { findCustomerByEmailStep } from "./steps/find-customer-by-email";
import { linkAuthIdentityToCustomerStep } from "./steps/link-auth-identity-to-customer";
import { updateCustomerAccountStep } from "./steps/update-customer-account";

type Input = {
  auth_identity_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};

export const claimCustomerAccountWorkflow = createWorkflow(
  "claim-customer-account",
  function (input: Input) {
    const customer = findCustomerByEmailStep({ email: input.email });

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
