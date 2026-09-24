import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { FITMENT_MODULE } from "../../../../../../modules/fitment";

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id, productId } = req.params;

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  logger.info(`Unlinking product ${productId} from fitment ${id}`);

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);

  await link.dismiss({
    [Modules.PRODUCT]: {
      product_id: productId,
    },
    [FITMENT_MODULE]: {
      fitment_id: id,
    },
  });

  logger.info(`Successfully unlinked product ${productId} from fitment ${id}`);
  res.status(204).send();
};
