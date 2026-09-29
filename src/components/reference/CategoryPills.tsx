"use client"

import { cn } from "@/lib/utils"
import type { Category } from "@/components/reference/types"

interface CategoryPillsProps {
  categories: Category[]
  activeSlug: string | null
  onSelect: (slug: string) => void
  showAll?: boolean
  allLabel?: string
  className?: string
}

/**
 * Rangée de filtres à rubriques — pilules carrées à filet (marine profond
 * lorsqu’actives), défilement horizontal sur mobile. `showAll` ajoute un
 * filtre « Tout » (slug null).
 */
export function CategoryPills({
  categories,
  activeSlug,
  onSelect,
  showAll = false,
  allLabel = "Tout",
  className,
}: CategoryPillsProps) {
  const chipClass = (active: boolean) =>
    cn(
      "inline-flex h-10 shrink-0 snap-start items-center gap-2 whitespace-nowrap border px-3.5 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      active
        ? "border-[#0a1e3c] bg-[#0a1e3c] text-white dark:border-white/50"
        : "border-zinc-300 bg-background text-foreground hover:border-brand-blue hover:text-brand-blue"
    )

  return (
    <div
      role="tablist"
      aria-label="Filtrer par catégorie"
      className={cn(
        "nice-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5",
        className
      )}
    >
      {showAll ? (
        <button
          type="button"
          role="tab"
          aria-selected={activeSlug === null}
          onClick={() => onSelect("")}
          className={chipClass(activeSlug === null)}
        >
          {allLabel}
        </button>
      ) : null}
      {categories.map((category) => {
        const active = category.slug === activeSlug
        return (
          <button
            key={category.slug}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(category.slug)}
            className={chipClass(active)}
          >
            <span
              aria-hidden="true"
              className={cn("size-2 shrink-0", active && "bg-white")}
              style={active ? undefined : { backgroundColor: category.color }}
            />
            {category.name}
          </button>
        )
      })}
    </div>
  )
}
