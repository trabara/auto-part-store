import { Link, Query } from "@medusajs/framework/modules-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE } from "@repo/domain-modules/fitment";
import FitmentProductLink from "../../links/fitment-product";

type DismissFitmentLinksInput = {
  fitment_ids: string[];
};

type DismissFitmentLinksOutput = {
  dismissed_links: Array<{
    product_id: string;
    fitment_id: string;
  }>;
};

export const dismissFitmentLinksStep = createStep(
  "dismiss-fitment-links-step",
  async (input: DismissFitmentLinksInput, { container }) => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY);
    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK);

    const dismissedLinks: Array<{ product_id: string; fitment_id: string }> =
      [];

    for (const fitmentId of input.fitment_ids) {
      const { data } = await query.graph({
        entity: FitmentProductLink.entryPoint,
        fields: ["product_id", "fitment_id"],
        filters: {
          fitment_id: fitmentId,
        },
      });

      for (const linkData of data) {
        await link.dismiss({
          [Modules.PRODUCT]: {
            product_id: linkData.product_id,
          },
          [FITMENT_MODULE]: {
            fitment_id: linkData.fitment_id,
          },
        });

        dismissedLinks.push({
          product_id: linkData.product_id,
          fitment_id: linkData.fitment_id,
        });
      }
    }

    return new StepResponse(
      { dismissed_links: dismissedLinks },
      { dismissed_links: dismissedLinks },
    );
  },
  async (output: DismissFitmentLinksOutput | undefined, { container }) => {
    if (
      !output ||
      !output.dismissed_links ||
      output.dismissed_links.length === 0
    ) {
      return;
    }

    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK);

    await Promise.all(
      output.dismissed_links.map((linkData) =>
        link.create({
          [Modules.PRODUCT]: {
            product_id: linkData.product_id,
          },
          [FITMENT_MODULE]: {
            fitment_id: linkData.fitment_id,
          },
        }),
      ),
    );
  },
);
