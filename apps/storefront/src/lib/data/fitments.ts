'use server'

import { sdk } from "../config";
import { Fitment } from "../types";
import { getFitmentId, removeFitmentId, setFitmentId } from "./cookies";


export async function retreiveFitment(): Promise<Fitment | null> {
    const id = await getFitmentId()
    if (!id) {
        return null
    }
    const { fitment } = await sdk.client.fetch<{ fitment: any }>(`/store/fitments/${id}`, {
        method: "GET",
        query: {
            fields: "id,year_start,year_end,engine",
        },
    })
    return fitment
}

export async function addFitment(id: string) {
    await setFitmentId(id)
}

export async function clearFitment() {
    await removeFitmentId()
}