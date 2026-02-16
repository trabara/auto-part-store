import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

const FITMENT_MODULE = "fitment";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Query product with its linked fitments
  // Since the link is Product -> Fitments, we query from product side
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "fitments.id",
      "fitments.body_style",
      "fitments.doors",
      "fitments.drive",
      "fitments.transmission",
      "fitments.year_start",
      "fitments.year_end",
      "fitments.model.id",
      "fitments.model.name",
      "fitments.model.make.id",
      "fitments.model.make.name",
      "fitments.engine.id",
      "fitments.engine.fuel",
      "fitments.engine.type",
      "fitments.engine.size",
      "fitments.engine.tech",
    ],
    filters: {
      id: productId,
    },
  });

  const fitments = products && products[0] ? products[0].fitments || [] : [];
  res.json({ fitments });
}

export async function POST(
  req: MedusaRequest<{ fitment_ids: string[] }>,
  res: MedusaResponse,
) {
  const { id: productId } = req.params;
  const { fitment_ids } = req.validatedBody;

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);

  // Create links between product and fitments
  // Order must match defineLink: Product first, then Fitment
  const linkPromises = fitment_ids.map((fitmentId) =>
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
    message: "Fitments linked successfully",
    product_id: productId,
    fitment_ids,
  });
}
