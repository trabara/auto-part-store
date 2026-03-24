import { sdk } from "@/lib/config"

export type SocialLinks = {
  facebook?: string
  twitter?: string
  instagram?: string
}

export type StoreDetails = {
  id: string
  name: string
  logo_url: string | null
  map_url: string | null
  address: string | null
  contact_emails: string[] | null
  contact_phone_numbers: string[] | null
  social_links: Record<string, string> | null
}

export async function retrieveStoreDetails(): Promise<StoreDetails> {
  const { store } = await sdk.client.fetch<{ store: StoreDetails }>(
    "/store/details"
  )
  return store
}
