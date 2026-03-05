import { PaginatedQueryParams } from "../../../hooks";
import { sdk } from "../../../lib/sdk";
import { CreateModelInput, UpdateModelInput } from "../../../../modules/fitment/schema";
import { ModelListResponse, ModelsWithFitmentsResponse } from "./types";

export function listModels(signal: AbortSignal, params?: PaginatedQueryParams): Promise<ModelListResponse> {
    return sdk.client.fetch("/admin/models", {
        signal,
        method: "GET",
        query: {
            ...(params || {}),
            fields: "id,name",
        },
    });
}

export function listModelsWithFitments(signal: AbortSignal, params?: PaginatedQueryParams): Promise<ModelsWithFitmentsResponse> {
    return sdk.client.fetch("/admin/models", {
        signal,
        method: "GET",
        query: {
            ...(params || {}),
            fields: "*fitments.id,*make.name",
        },
    });
}

export function createModel(input: CreateModelInput): Promise<void> {
    return sdk.client.fetch("/admin/models", {
        method: "POST",
        body: input
    })
}

export function deleteModel(id: string): Promise<void> {
    return sdk.client.fetch(`/admin/models/${id}`, {
        method: "DELETE",
    });
}

export function updateModel(id?: string) {
    return (input: UpdateModelInput): Promise<void> => {
        if (!id) {
            return Promise.reject(new Error("Model ID is required for update"));
        }
        return sdk.client.fetch(`/admin/models/${id}`, {
            method: "PATCH",
            body: input,
        });
    }
}