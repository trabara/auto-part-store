import { PaginatedQueryParams } from "~/admin/hooks";
import { sdk } from "~/admin/lib/sdk";
import { CreateFitmentInput } from "~/modules/fitment/schema";
import { AdminFitmentResponse, AdminFitmentWithProducts } from "./types";

export function listFitments(params: PaginatedQueryParams): Promise<AdminFitmentResponse<AdminFitmentWithProducts>> {
    return sdk.client.fetch(`/admin/fitments`, {
        query: {
            ...params,
            fields: "*engine,*model,*model.make,*products.*",
        },
    });
}

export function createFitment(input: CreateFitmentInput): Promise<void> {
    return sdk.client.fetch(`/admin/fitments`, {
        method: "POST",
        body: input,
    });
}

export function updateFitment(id?: string) {
    return (input: CreateFitmentInput): Promise<void> => {
        if (!id) {
            return Promise.reject(new Error("Fitment ID is required for update"));
        }
        return sdk.client.fetch(`/admin/fitments/${id}`, {
            method: "PUT",
            body: input,
        });
    }
}

export function deleteFitment(id: string): Promise<void> {
    return sdk.client.fetch(`/admin/fitments/${id}`, {
        method: "DELETE",
    });
}