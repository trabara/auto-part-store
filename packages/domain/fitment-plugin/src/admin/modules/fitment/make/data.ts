import { PaginatedQueryParams } from "../../../hooks";
import { sdk } from "../../../lib/sdk";
import { CreateMakeInput, UpdateMakeInput } from "@trabara/core/dtos";
import { MakeListResponse, MakeWithModels } from "./types";

export function listMakes(signal: AbortSignal): Promise<MakeListResponse> {
  return sdk.client.fetch(`/admin/makes`, {
    signal,
  });
}

export function listMakesWithModels(
  signal: AbortSignal,
  params?: PaginatedQueryParams,
): Promise<MakeListResponse<MakeWithModels>> {
  return sdk.client.fetch(`/admin/makes`, {
    signal,
    query: {
      ...(params || {}),
      fields: "*models",
    },
  });
}

export function createMake(input: CreateMakeInput) {
  return sdk.client.fetch(`/admin/makes`, {
    method: "POST",
    body: input,
  });
}

export function updateMake(id?: string) {
  return (input: UpdateMakeInput) => {
    if (!id) {
      return Promise.reject(new Error("Make ID is required for update"));
    }
    return sdk.client.fetch(`/admin/makes/${id}`, {
      method: "PATCH",
      body: input,
    });
  };
}

export function deleteMake(id: string) {
  return sdk.client.fetch(`/admin/makes/${id}`, {
    method: "DELETE",
  });
}
