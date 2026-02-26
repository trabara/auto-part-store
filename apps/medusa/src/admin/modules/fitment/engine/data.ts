import { sdk } from "~/admin/lib/sdk";
import { CreateEngineInput } from "~/modules/fitment/schema";
import { AdminEngineListResponse } from "./types";
import { PaginatedQueryParams } from "hooks/use-paginated-query";

export function listEngines(signal: AbortSignal, params?: PaginatedQueryParams): Promise<AdminEngineListResponse> {
    return sdk.client.fetch(`/admin/engines`, {
        signal,
        method: "GET",
        query: {
            ...(params || {}),
        }
    })
}

export function createEngine(input: CreateEngineInput): Promise<void> {
    return sdk.client.fetch(`/admin/engines`, {
        method: "POST",
        body: input,
    })
}

export function updateEngine(id?: string) {
    return (input: CreateEngineInput): Promise<void> => {
        if (!id) {
            return Promise.reject(new Error("Engine ID is required for update"))
        }
        return sdk.client.fetch(`/admin/engines/${id}`, {
            method: "PATCH",
            body: input,
        })
    }
}

export function deleteEngine(id: string): Promise<void> {
    return sdk.client.fetch(`/admin/engines/${id}`, {
        method: "DELETE"
    })
}