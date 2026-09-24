import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
// import FitmentProductLink from "../../../../../links/fitment-product";
import {
    FITMENT_MODULE
} from "../../../../../modules/fitment";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // const { id } = req.params;
  // const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  // const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  // const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  // logger.info(`Fetching fitments for product: ${id}`);
  // // Use the link entry point to get the fitment IDs linked to this product
  // const { data: linkRows, metadata } = await query.graph({
  //   entity: FitmentProductLink.entryPoint,
  //   fields: ["fitment_id"],
  //   filters: { product_id: id },
  // });
  // const fitmentIds = linkRows.map((row: any) => row.fitment_id).filter(Boolean);
  // if (!fitmentIds.length) {
  //   res.status(200).json({ data: [], metadata });
  //   return;
  // }
  // // Hydrate fitments with model + make + engine via the service
  // const fitments = await service.listVehicles(
  //   {
  //     id: { $in: fitmentIds },
  //   },
  //   {
  //     relations: ["model", "model.make", "engine"],
  //   },
  // );
  // logger.info(`Found ${fitments.length} fitments for product ${id}`);
  // res.status(200).json({ data: fitments, metadata });
};

export const POST = async (
  req: MedusaRequest<{
    fitment_ids: string[];
  }>,
  res: MedusaResponse,
) => {
  const { id } = req.params;
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { fitment_ids } = req.validatedBody;
  logger.info(`Linking ${fitment_ids.length} fitments to product ${id}`);

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);

  await Promise.all(
    fitment_ids.map((fitmentId) =>
      link.create({
        [Modules.PRODUCT]: {
          product_id: id,
        },
        [FITMENT_MODULE]: {
          fitment_id: fitmentId,
        },
      }),
    ),
  );

  logger.info(
    `Successfully linked ${fitment_ids.length} fitments to product ${id}`,
  );

  res.status(200).json({
    message: "Fitments linked successfully",
    product_id: id,
    fitment_ids,
  });
};
