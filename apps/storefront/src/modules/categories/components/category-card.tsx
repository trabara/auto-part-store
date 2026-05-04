import { StoreProductCategory } from "@/lib/data/categories"
import { ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ProductCategoryCard({
    category
}: {
    category: StoreProductCategory
}) {
    const imageUrl = category.entity_media?.[0]?.url || null


    return (
        <Link
            key={category.id}
            href={`/${category.handle}`}
            className="group relative flex flex-col justify-end overflow-hidden bg-zinc-900 min-h-[180px] p-5"
        >
            {/* Hover accent bar */}
            <div className="absolute top-0 left-0 h-1 w-0 bg-white transition-all duration-300 group-hover:w-full" />

            {/* Diagonal bg accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {imageUrl && (
                <Image
                    src={imageUrl}
                    alt={category.name}
                    fill
                    unoptimized
                    loading="eager"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                // className="object-contain p-4 opacity-40 invert contrast-[2]"
                />
            )}
            {/* Dark gradient so text stays readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <span className="relative z-10 text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
                Parts
            </span>
            <span className="relative z-10 text-sm font-extrabold uppercase tracking-wider text-white leading-tight">
                {category.name}
            </span>
            <ChevronRight className="absolute bottom-4 right-4 size-4 text-white/25 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-200" />
        </Link>
    )
}
