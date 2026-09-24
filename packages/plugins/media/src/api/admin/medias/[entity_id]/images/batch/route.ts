import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { UpdateMediasInput } from "@trabara/core";
import {
  deleteMediasWorkflow,
  updateMediasWorkflow,
} from "../../../../../../workflows";

export async function POST(
  req: MedusaRequest<UpdateMediasInput>,
  res: MedusaResponse,
): Promise<void> {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(
    `Updating media for entity ${JSON.stringify({
      entity: req.params.entity,
      entity_id: req.params.id,
    })}`,
  );

  const { updates } = req.validatedBody as UpdateMediasInput;

  const { result } = await updateMediasWorkflow(req.scope).run({
    input: { updates },
  });

  res.status(200).json({ medias: result });
}

export async function DELETE(
  req: MedusaRequest<{ ids: string[] }>,
  res: MedusaResponse,
): Promise<void> {
  const { ids } = req.validatedBody;

  await deleteMediasWorkflow(req.scope).run({
    input: { ids },
  });

  res.status(200).json({ deleted: ids });
}
