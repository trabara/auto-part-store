import { sdk } from "@/lib/config"

export const getDefaultRegion = async () => {
  const { regions } = await sdk.store.region.list()
  return regions[0]
}
