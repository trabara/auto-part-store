import { sdk } from "~/admin/lib/sdk";
import { CreateEngineInput } from "~/modules/fitment/schema";
import { AdminEngineListResponse } from "./types";

export function listEngines(): Promise<AdminEngineListResponse> {
    return sdk.client.fetch(`/admin/engines`, { method: "GET", query: { fields: "id,type,size" } })
}

export function createEngine(input: CreateEngineInput): Promise<void> {
    return sdk.client.fetch(`/admin/engines`, { body: input, method: "POST" })
}

export function updateEngine(id?: string) {
    return (input: CreateEngineInput): Promise<void> => {
        if (!id) {
            return Promise.reject(new Error("Engine ID is required for update"))
        }
        return sdk.client.fetch(`/admin/engines/${id}`, { body: input, method: "PUT" })
    }
}

export function deleteEngine(id: string): Promise<void> {
    return sdk.client.fetch(`/admin/engines/${id}`, { method: "DELETE" })
}