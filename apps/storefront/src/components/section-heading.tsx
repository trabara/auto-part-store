import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SectionHeading({
    title,
    href,
    linkLabel = "View All",
}: {
    title: string
    href?: string
    linkLabel?: string
}) {
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
                    href={href}
                    className="hidden md:inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                    {linkLabel}
                    <ArrowRight className="size-4" />
                </Link>
            )}
        </div>
    )
}