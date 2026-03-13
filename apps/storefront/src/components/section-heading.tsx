import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"

export default async function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string
  href?: string
  linkLabel?: string
}) {
  const t = await getTranslations("sectionHeading")
  const label = linkLabel ?? t("viewAll")

  return (
    <div className="flex items-center justify-between mb-8">
      <p className="relative text-2xl font-extrabold uppercase tracking-widest text-foreground">
        <span className="relative">
          {title}
          <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-primary" />
        </span>
      </p>
      {href && (
        <Link
          href={href as any}
          className="hidden md:inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          {label}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  )
}
