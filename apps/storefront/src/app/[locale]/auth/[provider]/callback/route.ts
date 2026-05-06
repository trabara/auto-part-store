import { setAuthToken } from "@/lib/data/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; provider: string }> }
) {
  await params // satisfy Next.js dynamic params contract

  const { searchParams } = request.nextUrl
  const token = searchParams.get("token")
  const return_to = searchParams.get("return_to")

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/login?message=oauth_failed", request.url)
    )
  }

  await setAuthToken(token)
  // const cookieStore = await cookies()
  // cookieStore.set("_medusa_jwt", token, {
  //   maxAge: 60 * 60 * 24 * 7,
  //   httpOnly: true,
  //   sameSite: "strict",
  //   secure: process.env.NODE_ENV === "production",
  //   path: "/",
  // })

  const destination =
    return_to && return_to.startsWith("/") ? return_to : "/account"

  return NextResponse.redirect(new URL(destination, request.url))
}
