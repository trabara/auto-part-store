'use server'

import { sdk } from "../config"
import { FitmentListResponse } from "../types"

export async function listMakesByYearRange(year_start: number, year_end?: number): Promise<FitmentListResponse> {
    const filters: Record<string, any> = {
        models: {
            fitments: {
                year_start
            }
        }
    }

    if (year_end) {
        filters.models.fitments.year_end = year_end
    }

    return sdk.client.fetch(`/store/makes`, {
        method: "GET",
        query: {
            fields: "id,name,created_at,updated_at,models.id,models.name,models.fitments.id,models.fitments.engine.*",
            filters
        },
    })
}

export async function listMakesAction(state: any, formData: FormData) {
    const year_start = formData.get("year_start") as string
    const year_end = formData.get("year_end") as string

    return listMakesByYearRange(Number(year_start), year_end ? Number(year_end) : undefined)
}
