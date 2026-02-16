import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import FitmentProductLink from "../../../../../links/fitment-product";

const FITMENT_MODULE = "fitment";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: FitmentProductLink.entryPoint,
    fields: ["product.*", "product.variants.*"],
    filters: {
      fitment_id: id,
    },
  });
  const products = data.map((item) => item.product);

  return res.json({
    products: products,
    count: products.length,
  });
}

export async function POST(
  req: MedusaRequest<{ product_ids: string[] }>,
  res: MedusaResponse,
) {
  const { id: fitmentId } = req.params;
  const { product_ids } = req.validatedBody;

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);

  // Create links between product and fitment
  // Order must match defineLink: Product first, then Fitment
  const linkPromises = product_ids.map((productId) =>
    link.create({
      [Modules.PRODUCT]: {
        product_id: productId,
      },
      [FITMENT_MODULE]: {
        fitment_id: fitmentId,
      },
    }),
  );

  await Promise.all(linkPromises);

  res.status(200).json({
    message: "Products linked successfully",
    fitment_id: fitmentId,
    product_ids,
  });
}
