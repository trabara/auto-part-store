import { setAuthToken } from "@/lib/data/cookies"
import { redirect } from "next/navigation"

type Props = {
  searchParams: Promise<{ token?: string; return_to?: string }>
}

export default async function GoogleCallbackPage({ searchParams }: Props) {
  const { token, return_to } = await searchParams

  if (!token) {
    redirect("/auth/login?message=oauth_failed")
  }

  await setAuthToken(token)

  const destination =
    return_to && return_to.startsWith("/") ? return_to : "/account"

  redirect(destination)
}
