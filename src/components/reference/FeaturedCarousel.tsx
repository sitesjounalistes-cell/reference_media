"use client"

/**
 * Carrousel « À la une » : tous les articles mis en avant défilent
 * automatiquement de gauche à droite (boucle), avec flèches, pastilles de
 * position, pause au survol/focus et quand l'onglet est masqué.
 * Repli à une carte simple quand un seul article est à la une.
 */

import * as React from "react"

import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { ArticleCard } from "@/components/reference/ArticleCard"
import { SmartImage } from "@/components/reference/SmartImage"
import type { ArticleListItem } from "@/components/reference/types"

/** Délai entre deux avancées automatiques (ms). */
const AUTO_ADVANCE_MS = 6000

export function FeaturedCarousel({
  articles,
  onOpen,
}: {
  articles: ArticleListItem[]
  onOpen: (slug: string) => void
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: 28,
  })
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isPaused, setIsPaused] = React.useState(false)

  // Synchronise les pastilles avec la diapositive visible.
  React.useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on("select", onSelect)
    onSelect()
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  // Avance automatique — suspendue au survol/focus et onglet masqué.
  React.useEffect(() => {
    if (!emblaApi || isPaused || document.hidden) return
    const id = window.setInterval(() => emblaApi.scrollNext(), AUTO_ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [emblaApi, isPaused])

  // Pause quand l'onglet n'est pas visible (économie + accessibilité).
  React.useEffect(() => {
    const onVisibility = () => setIsPaused(document.hidden)
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  // Un seul article : pas de carrousel, la carte héro classique suffit.
  if (articles.length === 1) {
    return (
      <ArticleCard
        article={articles[0]}
        variant="hero"
        onOpen={onOpen}
        eager
      />
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {/* Pistes du carrousel */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {articles.map((article, index) => (
            <div
              key={article.id}
              className="relative min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="diapositive"
              aria-label={`${index + 1} / ${articles.length}`}
            >
              <button
                type="button"
                onClick={() => onOpen(article.slug)}
                className="group relative block aspect-[16/10] w-full overflow-hidden border bg-muted text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:aspect-[21/10] lg:aspect-[21/8]"
                aria-label={article.title}
              >
                <SmartImage
                  src={article.coverImage}
                  alt={article.title}
                  fallbackColor={article.category.color}
                  eager={index < 2}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                {/* Voile dégradé pour la lisibilité du texte */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/35 to-transparent"
                />
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 sm:p-7 lg:p-9">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span
                      className="border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
                      style={{ backgroundColor: article.category.color }}
                    >
                      {article.category.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-300">
                      {article.readMinutes} min
                    </span>
                  </span>
                  <span className="headline max-w-3xl text-xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                    {article.title}
                  </span>
                  <span className="line-clamp-2 max-w-2xl text-sm text-zinc-200/90 sm:text-[15px]">
                    {article.excerpt}
                  </span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Flèches de navigation */}
      <button
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Article précédent"
        className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-zinc-950/55 text-white backdrop-blur-sm outline-none transition-colors hover:bg-zinc-950/85 focus-visible:ring-[3px] focus-visible:ring-white/60"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Article suivant"
        className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-zinc-950/55 text-white backdrop-blur-sm outline-none transition-colors hover:bg-zinc-950/85 focus-visible:ring-[3px] focus-visible:ring-white/60"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>

      {/* Pastilles de position */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {articles.map((article, index) => (
          <button
            key={article.id}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Aller à la diapositive ${index + 1}`}
            aria-current={index === selectedIndex ? "true" : undefined}
            className={cn(
              "h-1.5 outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50",
              index === selectedIndex
                ? "w-7 bg-brand-red"
                : "w-3 bg-border hover:bg-muted-foreground/40"
            )}
          />
        ))}
      </div>
    </div>
  )
}
