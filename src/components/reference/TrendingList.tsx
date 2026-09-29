"use client"

import { Eye } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatViews, useFetch } from "@/components/reference/lib"
import { ErrorState } from "@/components/reference/ErrorState"
import { Skeleton } from "@/components/ui/skeleton"
import type { ArticlesResponse } from "@/components/reference/types"

interface TrendingListProps {
  onOpen: (slug: string) => void
  className?: string
}

/** « Les plus lus » : classement 01→05 des articles les plus consultés. */
export function TrendingList({ onOpen, className }: TrendingListProps) {
  const { data, error, loading, retry } = useFetch<ArticlesResponse>(
    "/api/trending?limit=5"
  )

  return (
    <section
      aria-labelledby="trending-heading"
      className={cn("border-t-2 border-foreground pt-4", className)}
    >
      <p className="kicker flex items-center gap-2 text-brand-red">
        <span aria-hidden="true" className="brand-square bg-brand-red" />
        Classement
      </p>
      <h2
        id="trending-heading"
        className="headline mt-1.5 border-b-2 border-foreground pb-3 text-xl font-bold tracking-tight"
      >
        Les plus lus
      </h2>

      {loading ? (
        <div className="divide-y divide-border" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-4">
              <Skeleton className="h-8 w-12" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          compact
          className="mt-4 border-0 bg-transparent"
          onRetry={retry}
        />
      ) : !data || data.articles.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Pas encore de tendances — revenez très vite !
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {data.articles.map((article, index) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => onOpen(article.slug)}
                className="group flex w-full items-start gap-3 py-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
              >
                <span
                  aria-hidden="true"
                  className="editorial-num w-12 shrink-0 text-3xl leading-none text-zinc-200 transition-colors duration-300 group-hover:text-brand-red"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className="headline line-clamp-2 block text-[15px] font-semibold leading-snug transition-colors duration-300 group-hover:text-brand-blue">
                    {article.title}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="truncate">{article.category.name}</span>
                    <span aria-hidden="true" className="h-2.5 w-px shrink-0 bg-border" />
                    <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
                      <Eye className="size-3" aria-hidden="true" />
                      {formatViews(article.views)}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
