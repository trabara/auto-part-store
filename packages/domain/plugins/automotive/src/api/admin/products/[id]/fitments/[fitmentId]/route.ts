import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { FITMENT_MODULE } from "../../../../../../modules/fitment";

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: productId, fitmentId } = req.params;
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(`Unlinking fitment ${fitmentId} from product ${productId}`);

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);

  await link.dismiss({
    [Modules.PRODUCT]: {
      product_id: productId,
    },
    [FITMENT_MODULE]: {
      fitment_id: fitmentId,
    },
  });

  logger.info(
    `Successfully unlinked fitment ${fitmentId} from product ${productId}`,
  );

  res.status(200).json({
    message: "Fitment unlinked successfully",
    product_id: productId,
    fitment_id: fitmentId,
  });
};
