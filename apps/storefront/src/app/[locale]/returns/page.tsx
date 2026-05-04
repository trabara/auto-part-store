import { getTranslations } from "next-intl/server"
import { Construction } from "lucide-react"

export default async function ReturnsPage() {
  const t = await getTranslations("comingSoon")

  return (
    <div className="snap-container py-20">
      <div className="flex flex-col items-center justify-center text-center">
        <Construction className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
    </div>
  )
}