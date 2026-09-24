import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CreateVehicleInput } from "../modules/fitment/dto";
import { createFitmentsStep } from "./steps/create-fitments";
import { linkFitmentsToProductStep } from "./steps/link-fitments-to-product";

type CreateFitmentsWorkflowInput = {
  fitments: CreateVehicleInput[];
  product_id?: string;
};

export const createFitmentsWorkflow = createWorkflow(
  "create-fitments-workflow",
  function (input: CreateFitmentsWorkflowInput) {
    const { fitments } = createFitmentsStep(input.fitments);

    when(input, ({ product_id }) => !!product_id).then(() => {
      const linkInput = transform(
        { fitments, input },
        ({ fitments, input }) => ({
          product_id: input.product_id!,
          fitment_ids: fitments.map((f) => f.id),
        }),
      );
      linkFitmentsToProductStep(linkInput);
    });

    return new WorkflowResponse({ fitments });
  },
);
