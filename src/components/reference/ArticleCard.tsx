"use client"

import { ArrowRight, Clock, Eye } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  formatDateShort,
  formatViews,
  readMinutesLabel,
} from "@/components/reference/lib"
import { SmartImage } from "@/components/reference/SmartImage"
import type { ArticleListItem } from "@/components/reference/types"

export type ArticleCardVariant =
  | "hero"
  | "large"
  | "standard"
  | "compact"
  | "list"

/** Ratio d'image du variant « standard » (16/10 par défaut, 16/9 en colonne étroite). */
export type ArticleCardImageAspect = "16/10" | "16/9"

interface ArticleCardProps {
  article: ArticleListItem
  variant?: ArticleCardVariant
  onOpen: (slug: string) => void
  eager?: boolean
  className?: string
  /** Ratio de la photo du variant « standard » (défaut : 16/10). */
  imageAspect?: ArticleCardImageAspect
}

/* -------------------------------------------------------------------------- */
/*                          Sous-composants éditoriaux                        */
/* -------------------------------------------------------------------------- */

/** Surligneur de rubrique : carré de couleur 6 px + nom en capitales espacées. */
function Kicker({
  name,
  color,
  size = "sm",
}: {
  name: string
  color: string
  size?: "sm" | "md"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold uppercase",
        size === "sm" ? "text-[10px] tracking-[0.16em]" : "kicker"
      )}
      style={{ color }}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}

/** Séparateur vertical : filet fin (teinte adaptée au support). */
function MetaRule({ tone = "default" }: { tone?: "default" | "light" }) {
  return (
    <span
      aria-hidden="true"
      className={cn("h-3 w-px shrink-0", tone === "light" ? "bg-white/30" : "bg-border")}
    />
  )
}

/** Ligne de méta : auteur, date, durée de lecture (± vues en tabular-nums). */
function MetaRow({
  article,
  tone = "default",
  showAuthor = true,
  showViews = false,
  className,
}: {
  article: ArticleListItem
  /** « light » = posée sur une photographie (blanc translucide). */
  tone?: "default" | "light"
  showAuthor?: boolean
  showViews?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs",
        tone === "light" ? "text-white/80" : "text-zinc-500",
        className
      )}
    >
      {showAuthor ? (
        <>
          <span className="min-w-0 truncate">Par {article.author.name}</span>
          <MetaRule tone={tone} />
        </>
      ) : null}
      <time dateTime={article.publishedAt} className="shrink-0">
        {formatDateShort(article.publishedAt)}
      </time>
      <MetaRule tone={tone} />
      <span className="inline-flex shrink-0 items-center gap-1">
        <Clock className="size-3" aria-hidden="true" />
        {article.readMinutes} min
      </span>
      {showViews ? (
        <>
          <MetaRule tone={tone} />
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
            <Eye className="size-3" aria-hidden="true" />
            {formatViews(article.views)}
          </span>
        </>
      ) : null}
    </div>
  )
}

/** Bouton étiré sur toute la carte : navigation clavier + focus visible. */
function StretchedLink({
  label,
  onClick,
  ringClass,
}: {
  label: string
  onClick: () => void
  /** Anneau de focus adapté au support (blanc sur le héros). */
  ringClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute inset-0 z-10 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-inset",
        ringClass ?? "focus-visible:ring-ring/50"
      )}
    >
      <span className="sr-only">{label}</span>
    </button>
  )
}

const TITLE_HOVER = "transition-colors duration-300 group-hover:text-brand-blue"

/* -------------------------------------------------------------------------- */
/*                                  Variante                                  */
/* -------------------------------------------------------------------------- */

export function ArticleCard({
  article,
  variant = "standard",
  onOpen,
  eager = false,
  className,
  imageAspect = "16/10",
}: ArticleCardProps) {
  const { category } = article
  const open = () => onOpen(article.slug)
  const label = `Lire l'article : ${article.title}`

  /* --------------------------- Héros (photo plein cadre) ------------------- */
  if (variant === "hero") {
    return (
      <article
        className={cn(
          "group relative flex overflow-hidden bg-navy-deep outline-none",
          className
        )}
      >
        <div className="relative flex aspect-[16/10] w-full items-end lg:aspect-auto lg:h-full lg:min-h-[30rem]">
          <div className="img-zoom absolute inset-0">
            <SmartImage
              src={article.coverImage}
              alt=""
              fallbackColor={category.color}
              eager={eager}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Voile marine : lisible en bas, photographie visible en haut */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-[#071630]/90 via-transparent to-transparent"
          />
          <span className="kicker absolute left-0 top-0 bg-brand-red px-2.5 py-1 text-[10px] text-white">
            À la une
          </span>
          <div className="relative w-full p-4 md:p-7 lg:p-8">
            <span className="kicker inline-flex items-center gap-1.5 bg-white/95 px-2 py-1 text-[10px] text-ink">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </span>
            <h3 className="headline mt-2.5 line-clamp-3 text-3xl font-bold text-white md:text-[2.6rem]">
              {article.title}
            </h3>
            <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/80 md:text-[13px]">
              <span className="min-w-0 truncate">Par {article.author.name}</span>
              <MetaRule tone="light" />
              <time dateTime={article.publishedAt} className="shrink-0">
                {formatDateShort(article.publishedAt)}
              </time>
              <MetaRule tone="light" />
              <span className="inline-flex shrink-0 items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                {readMinutesLabel(article.readMinutes)}
              </span>
            </p>
          </div>
        </div>
        <StretchedLink
          label={label}
          onClick={open}
          ringClass="focus-visible:ring-white/90"
        />
      </article>
    )
  }

  /* ------------------------------- Large (liste continue) ------------------ */
  if (variant === "large") {
    return (
      <article
        className={cn(
          "group relative flex items-start gap-4 outline-none md:gap-6",
          className
        )}
      >
        <div className="img-zoom relative aspect-[4/3] w-40 shrink-0 md:w-56">
          <SmartImage
            src={article.coverImage}
            alt=""
            fallbackColor={category.color}
            eager={eager}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 py-0.5">
          <Kicker name={category.name} color={category.color} />
          <h3 className={cn("headline text-xl font-bold leading-snug md:text-2xl", TITLE_HOVER)}>
            <span className="line-clamp-3">{article.title}</span>
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-1.5">
            <MetaRow article={article} showViews={false} />
            <span className="kicker inline-flex items-center gap-1.5 text-brand-blue">
              <span className="link-underline">Lire</span>
              <ArrowRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
        <StretchedLink label={label} onClick={open} />
      </article>
    )
  }

  /* ------------------------------ Compact (fil) ---------------------------- */
  if (variant === "compact") {
    return (
      <article
        className={cn(
          "group relative border-b border-border py-3.5 outline-none last:border-b-0",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-2 size-1.5 shrink-0"
            style={{ backgroundColor: category.color }}
          />
          <div className="min-w-0 flex-1">
            <h4 className={cn("headline line-clamp-2 text-base font-semibold leading-snug", TITLE_HOVER)}>
              {article.title}
            </h4>
            <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-zinc-500">
              <span className="min-w-0 truncate">{article.author.name}</span>
              <span aria-hidden="true" className="h-2.5 w-px shrink-0 bg-border" />
              <time dateTime={article.publishedAt} className="shrink-0">
                {formatDateShort(article.publishedAt)}
              </time>
              <span aria-hidden="true" className="h-2.5 w-px shrink-0 bg-border" />
              <span className="inline-flex shrink-0 items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                {article.readMinutes} min
              </span>
            </p>
          </div>
        </div>
        <StretchedLink label={label} onClick={open} />
      </article>
    )
  }

  /* ------------------------------- List (recherche) ------------------------ */
  if (variant === "list") {
    return (
      <article
        className={cn("group relative flex items-start gap-4 outline-none", className)}
      >
        <div className="img-zoom relative aspect-[4/3] w-28 shrink-0 sm:w-36">
          <SmartImage
            src={article.coverImage}
            alt=""
            fallbackColor={category.color}
            eager={eager}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 py-0.5">
          <Kicker name={category.name} color={category.color} />
          <h3 className={cn("headline text-[17px] font-bold leading-snug md:text-lg", TITLE_HOVER)}>
            <span className="line-clamp-2 md:line-clamp-1">{article.title}</span>
          </h3>
          <p className="hidden line-clamp-1 text-sm text-muted-foreground md:block">
            {article.excerpt}
          </p>
          <MetaRow article={article} showViews className="mt-0.5" />
        </div>
        <StretchedLink label={label} onClick={open} />
      </article>
    )
  }

  /* --------------------------- Standard (verticale) ------------------------ */
  return (
    <article
      className={cn(
        "group relative flex flex-col border-b border-border pb-4 outline-none",
        className
      )}
    >
      <div
        className={cn(
          "img-zoom relative w-full",
          imageAspect === "16/9" ? "aspect-[16/9]" : "aspect-[16/10]"
        )}
      >
        <SmartImage
          src={article.coverImage}
          alt=""
          fallbackColor={category.color}
          eager={eager}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col items-start gap-2 pt-3.5">
        <Kicker name={category.name} color={category.color} />
        <h3 className={cn("headline text-lg font-bold leading-snug", TITLE_HOVER)}>
          <span className="line-clamp-3">{article.title}</span>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>
        <MetaRow article={article} showViews={false} className="mt-auto w-full pt-3" />
      </div>
      <StretchedLink label={label} onClick={open} />
    </article>
  )
}
