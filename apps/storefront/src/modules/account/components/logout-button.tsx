"use client"

import { logout } from "@/lib/data/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export function LogoutButton() {
  const t = useTranslations("account")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await logout()
          router.push("/")
          router.refresh()
        })
      }
    >
      <LogOut className="size-4 mr-2" />
      {t("logout")}
    </Button>
  )
}
