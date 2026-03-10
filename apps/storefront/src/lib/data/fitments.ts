"use server"

import { sdk } from "../config"
import { Fitment } from "../types"
import { getFitmentId, removeFitmentId, setFitmentId } from "./cookies"

export type ProductFitment = {
  id: string
  body_style: string
  doors: number
  drive: string
  transmission: string
  year_start: number
  year_end: number | null
  model: {
    id: string
    name: string
    make: {
      id: string
      name: string
    }
  }
  engine: {
    id: string
    fuel: string
    type: string
    size: string
    tech: string | null
  }
}

export async function retreiveFitment(): Promise<Fitment | null> {
  const id = await getFitmentId()
  if (!id) {
    return null
  }
  const { fitment } = await sdk.client.fetch<{ fitment: any }>(
    `/store/fitments/${id}`,
    {
      method: "GET",
      query: {
        fields: "id,year_start,year_end,engine",
      },
    }
  )
  return fitment
}

export async function addFitment(id: string) {
  await setFitmentId(id)
}

export async function clearFitment() {
  await removeFitmentId()
}

export async function getProductFitments(
  productId: string
): Promise<ProductFitment[]> {
  try {
    const { fitments } = await sdk.client.fetch<{ fitments: ProductFitment[] }>(
      `/store/products/${productId}/fitments`,
      { method: "GET" }
    )
    return fitments ?? []
  } catch {
    return []
  }
}
