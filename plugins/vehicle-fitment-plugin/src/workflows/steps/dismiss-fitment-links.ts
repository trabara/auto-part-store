import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE } from "../../modules/fitment";
import FitmentProductLink from "../../links/fitment-product";
import { Link, Query } from "@medusajs/framework/modules-sdk";

type DismissFitmentLinksInput = {
  fitment_ids: string[];
};

type DismissFitmentLinksOutput = {
  dismissed_links: Array<{
    product_id: string;
    fitment_id: string;
  }>;
};

/**
 * Workflow step to dismiss (remove) all product links for given fitments
 * This should be called BEFORE deleting fitments to prevent orphaned links
 */
export const dismissFitmentLinksStep = createStep(
  "dismiss-fitment-links",
  async function (
    input: DismissFitmentLinksInput,
    { container },
  ): Promise<
    StepResponse<DismissFitmentLinksOutput, DismissFitmentLinksOutput>
  > {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY);
    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK);

    const dismissedLinks: Array<{ product_id: string; fitment_id: string }> =
      [];

    // For each fitment, query all linked products and dismiss the links
    for (const fitmentId of input.fitment_ids) {
      // Query using the link entry point to find all products linked to this fitment
      const { data } = await query.graph({
        entity: FitmentProductLink.entryPoint,
        fields: ["product_id", "fitment_id"],
        filters: {
          fitment_id: fitmentId,
        },
      });

      // Dismiss each link
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
  // Compensation function: restore the links if the workflow fails
  async function (output: DismissFitmentLinksOutput, { container }) {
    if (
      !output ||
      !output.dismissed_links ||
      output.dismissed_links.length === 0
    ) {
      return;
    }

    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK);

    // Restore all dismissed links
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
