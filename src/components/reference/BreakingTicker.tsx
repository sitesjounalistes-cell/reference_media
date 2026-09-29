"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useFetch } from "@/components/reference/lib"
import type { ArticlesResponse, Navigate } from "@/components/reference/types"

/** Les 8 derniers articles publiés alimentent la piste « En direct ». */
const TICKER_URL = "/api/articles?sort=recent&pageSize=8"
/** Durée d'une boucle complète du bandeau défilant (style --ticker-duration). */
const TICKER_DURATION = "55s"

/** Petit losange séparateur entre deux titres de la piste. */
function Diamond({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-1 shrink-0 rotate-45 bg-zinc-300", className)}
    />
  )
}

/** Bloc rouge « En direct » (pastille pulsée), présent dans tous les états. */
function LiveBadge() {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 bg-brand-red px-3 text-white">
      <span aria-hidden="true" className="pulse-dot size-1.5 shrink-0 bg-white" />
      <span className="kicker whitespace-nowrap">En direct</span>
    </div>
  )
}

/**
 * Étage 3 du header — bandeau « En direct » : les 8 derniers titres publiés
 * défilent en boucle parfaite (la même liste est rendue deux fois, la seconde
 * copie étant masquée). La piste se met en pause au survol (.ticker-hover-pause)
 * et au focus clavier. Chaque titre est un bouton qui ouvre l'article.
 * Repli sans crash : amorce pendant le chargement, barre réduite (bloc rouge
 * seul) si la liste est vide ou en erreur.
 */
export function BreakingTicker({ navigate }: { navigate: Navigate }) {
  const { data, loading } = useFetch<ArticlesResponse>(TICKER_URL)
  const articles = data?.articles ?? []
  const hasArticles = articles.length > 0

  /** Une copie de la piste ; la seconde (duplicate) est masquée et hors tabulation. */
  const renderRun = (duplicate: boolean) => (
    <div className="flex items-center" aria-hidden={duplicate || undefined}>
      {articles.map((article) => (
        <React.Fragment key={article.id}>
          <button
            type="button"
            tabIndex={duplicate ? -1 : undefined}
            onClick={() => navigate({ type: "article", slug: article.slug })}
            className="flex h-11 shrink-0 items-center gap-2 px-4 text-foreground/85 outline-none transition-colors hover:text-brand-blue focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
          >
            <span
              className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: article.category.color }}
            >
              {article.category.name}
            </span>
            <span aria-hidden="true" className="text-zinc-400">
              ·
            </span>
            <span className="whitespace-nowrap text-xs font-medium">
              {article.title}
            </span>
          </button>
          <Diamond className="mx-1" />
        </React.Fragment>
      ))}
    </div>
  )

  // Chargement : barre pleine largeur avec bloc rouge + amorce de lecture.
  if (loading && !hasArticles) {
    return (
      <div className="band-paper dark:bg-background border-b">
        <div className="flex h-11 items-stretch overflow-hidden">
          <LiveBadge />
          <div
            aria-hidden="true"
            className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden px-4"
          >
            <span className="h-2 w-16 animate-pulse bg-muted" />
            <span className="h-2 w-40 animate-pulse bg-muted" />
            <span className="h-2 w-28 animate-pulse bg-muted" />
            <span className="h-2 w-48 animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  // Liste vide ou erreur : barre réduite — uniquement le bloc rouge « En direct ».
  if (!hasArticles) {
    return (
      <div className="w-fit border-b bg-brand-red text-white">
        <LiveBadge />
      </div>
    )
  }

  // Piste défilante : deux copies de la même liste pour une boucle sans couture.
  return (
    <div className="band-paper dark:bg-background border-b">
      <div className="flex h-11 items-stretch overflow-hidden">
        <LiveBadge />
        <div className="ticker-hover-pause relative min-w-0 flex-1 overflow-hidden [&:focus-within_.ticker-track]:[animation-play-state:paused]">
          <div
            className="ticker-track h-11"
            style={{ "--ticker-duration": TICKER_DURATION } as React.CSSProperties}
          >
            {renderRun(false)}
            {renderRun(true)}
          </div>
        </div>
      </div>
    </div>
  )
}
