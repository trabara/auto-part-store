import { PaginatedQueryParams } from "~/admin/hooks";
import { sdk } from "~/admin/lib/sdk";
import { MakeListResponse, MakeWithModels } from "./types";
import { CreateMakeInput, UpdateMakeInput } from "~/modules/fitment/schema";

export function listMakes(): Promise<MakeListResponse> {
    return sdk.client.fetch(`/admin/makes`, {
        query: {
            fields: "id,name",
            ...params,
        },
    });
}

export function listMakesWithModels(params: PaginatedQueryParams): Promise<MakeListResponse<MakeWithModels>> {
    return sdk.client.fetch(`/admin/makes`, {
        query: {
            fields: "*models",
            ...params,
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
            method: "PUT",
            body: input,
        });
    }
}

export function deleteMake(id: string) {
    return sdk.client.fetch(`/admin/makes/${id}`, {
        method: "DELETE",
    });
}
