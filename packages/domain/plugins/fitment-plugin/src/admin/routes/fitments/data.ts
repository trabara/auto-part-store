
import { sdk } from "@repo/admin/lib/sdk";
import { PageQueryParams } from "@repo/admin/types/query";
import { FitmentListResponse } from "./types";

export function listFitments(
  signal: AbortSignal,
  params?: PageQueryParams,
): Promise<FitmentListResponse> {
  return sdk.client.fetch(`/admin/fitments`, {
    signal,
    query: {
      ...(params || {}),
      fields:
        "id,body_style,drive,transmission,doors,year_start,year_end,model.id,model.name,model.make.id,model.make.name,engine.id,engine.fuel,engine.type,engine.size,engine.tech,products.id",
    },
  });
}

export function createFitment(input: Record<string, unknown>): Promise<void> {
  return sdk.client.fetch(`/admin/fitments`, {
    method: "POST",
    body: input,
  });
}

export function deleteFitment(id: string): Promise<void> {
  return sdk.client.fetch(`/admin/fitments/${id}`, {
    method: "DELETE",
  });
}
