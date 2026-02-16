import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { FITMENT_MODULE } from "../../../../modules/fitment";
import { UpdateMakeInput } from "../../../../modules/fitment/schema";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve("query");

  console.log("[GET /admin/makes/:id] Fetching make with ID:", id);

  try {
    const { data } = await query.graph(
      {
        entity: "fitment_make",
        fields: ["id", "name", "created_at", "updated_at", "models.*"],
        filters: { id },
      },
      {
        throwIfKeyNotFound: true,
      },
    );

    console.log("[GET /admin/makes/:id] Found make");

    res.json({ make: data[0] });
  } catch (error: any) {
    console.error("[GET /admin/makes/:id] Error:", error.message);

    if (error.message?.includes("not found") || error.type === "not_found") {
      return res.status(404).json({ message: "Make not found" });
    }

    return res
      .status(500)
      .json({ message: "Error fetching make", error: error.message });
  }
}

export async function PATCH(
  req: MedusaRequest<UpdateMakeInput>,
  res: MedusaResponse,
) {
  const { id } = req.params;
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);

  const [make] = await fitmentModuleService.updateFitmentMakes([
    { ...req.validatedBody, id },
  ]);

  res.status(200).json({ make });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const fitmentModuleService = req.scope.resolve(FITMENT_MODULE);

  await fitmentModuleService.deleteMakeWithCascade(id);

  res.status(200).json({
    id,
    object: "make",
    deleted: true,
  });
}
