import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

const FITMENT_MODULE = "fitment";

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId, fitmentId } = req.params;
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);

  // Dismiss (remove) the link between product and fitment
  // Order must match defineLink: Product first, then Fitment
  await link.dismiss({
    [Modules.PRODUCT]: {
      product_id: productId,
    },
    [FITMENT_MODULE]: {
      fitment_id: fitmentId,
    },
  });

  res.status(200).json({
    message: "Fitment unlinked successfully",
    product_id: productId,
    fitment_id: fitmentId,
    deleted: true,
  });
}
