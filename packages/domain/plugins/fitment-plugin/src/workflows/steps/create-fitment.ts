import { Link } from "@medusajs/framework/modules-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE } from "@repo/domain-modules/fitment";
import { CreateFitmentInput } from "@trabara/core/dtos";

type CreateFitmentStepInput = {
  fitments: CreateFitmentInput[];
  product_id?: string;
};

export const createFitmentsStep = createStep(
  "create-fitments-step",
  async function (input: CreateFitmentStepInput, { container }) {
    const fitmentModuleService = container.resolve(FITMENT_MODULE) as any;
    const fitments = await fitmentModuleService.createFullFitments(
      input.fitments,
    );

    if (input.product_id) {
      const link = await container.resolve<Link>(
        ContainerRegistrationKeys.LINK,
      );
      await link.create({
        [Modules.PRODUCT]: {
          product_id: input.product_id,
        },
        [FITMENT_MODULE]: {
          fitment_id: fitments.map((fitment) => fitment.id),
        },
      });
    }

    return new StepResponse(fitments, {
      fitment_ids: fitments.map((fitment) => fitment.id),
    });
  },
  async function (input, { container }) {
    if (!input) {
      return;
    }
    const fitmentModuleService = container.resolve(FITMENT_MODULE) as any;
    return fitmentModuleService.deleteFitments(input.fitment_ids);
  },
);
