"use client"

import { searchProducts, SearchSuggestion } from "@/lib/data/products"
import { Input } from "@repo/ui/components/input"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@repo/ui/components/popover"
import { cn } from "@repo/ui/lib/utils"
import { SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ComponentProps,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

type Props = ComponentProps<"form">

export function SearchWithAutocomplete({ className, ...props }: Props) {
  const t = useTranslations("search")
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Debounced fetch
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const results = await searchProducts(q)
      setSuggestions(results)
      setOpen(results.length > 0)
    } catch {
      setSuggestions([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchSuggestions])

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  const navigateToSearch = (q: string) => {
    if (!q.trim()) return
    setOpen(false)
    setSuggestions([])
    router.push(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  const navigateToProduct = (handle: string) => {
    setOpen(false)
    setSuggestions([])
    setQuery("")
    router.push(`/p/${handle}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigateToSearch(query)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return

    const total = suggestions.length + 1 // +1 for "view all" footer item
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % total)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + total) % total)
    } else if (e.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex === -1 || activeIndex === suggestions.length) {
        // "View all" or no selection
        navigateToSearch(query)
      } else {
        const product = suggestions[activeIndex]
        if (product) navigateToProduct(product.handle)
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <form
          onSubmit={handleSubmit}
          className={cn("relative", className)}
          {...props}
        >
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
            <SearchIcon className="size-4" />
            <span className="sr-only">{t("srOnly")}</span>
          </div>
          <Input
            ref={inputRef}
            name="q"
            type="search"
            value={query}
            autoComplete="off"
            placeholder={t("placeholder")}
            className="bg-background peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true)
            }}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-activedescendant={
              activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
            }
          />
        </form>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="p-0 overflow-hidden w-(--radix-popover-trigger-width)"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={() => setOpen(false)}
      >
        <ul ref={listRef} role="listbox" className="py-1">
          {suggestions.map((product, i) => (
            <li
              key={product.id}
              id={`suggestion-${i}`}
              role="option"
              aria-selected={activeIndex === i}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer text-sm transition-colors",
                activeIndex === i
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/60"
              )}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                navigateToProduct(product.handle)
              }}
            >
              <div className="size-10 shrink-0 rounded border bg-background overflow-hidden flex items-center justify-center">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    width={40}
                    height={40}
                    className="object-contain size-full"
                  />
                ) : (
                  <SearchIcon className="size-4 text-muted-foreground" />
                )}
              </div>
              <span className="flex-1 min-w-0 truncate">{product.title}</span>
            </li>
          ))}

          {/* "View all results" footer */}
          <li
            id={`suggestion-${suggestions.length}`}
            role="option"
            aria-selected={activeIndex === suggestions.length}
            className={cn(
              "flex items-center gap-2 px-3 py-2 cursor-pointer text-sm font-medium border-t transition-colors",
              activeIndex === suggestions.length
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/60"
            )}
            onMouseEnter={() => setActiveIndex(suggestions.length)}
            onMouseDown={(e) => {
              e.preventDefault()
              navigateToSearch(query)
            }}
          >
            <SearchIcon className="size-4 shrink-0" />
            <span className="truncate">
              {t("viewAllResults", { q: query })}
            </span>
          </li>
        </ul>

        {loading && (
          <div className="px-3 py-2 text-xs text-muted-foreground border-t">
            {t("searching")}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
