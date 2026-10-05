"use client"

import * as React from "react"

import { motion } from "framer-motion"
import { ArrowUpRight, Loader2, Newspaper } from "lucide-react"

import { AdSlot } from "@/components/reference/AdSlot"
import { ArticleCard } from "@/components/reference/ArticleCard"
import { ErrorState } from "@/components/reference/ErrorState"
import { FactWidget } from "@/components/reference/FactWidget"
import { FeaturedCarousel } from "@/components/reference/FeaturedCarousel"
import { NewsletterForm } from "@/components/reference/NewsletterForm"
import { TrendingList } from "@/components/reference/TrendingList"
import { getCategoryIcon, useFetch } from "@/components/reference/lib"
import { useI18n, useI18nFetch } from "@/components/reference/lang-context"
import { usePagedArticles } from "@/components/reference/use-paged-articles"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
  ArticleListItem,
  ArticlesResponse,
  Category,
  Navigate,
} from "@/components/reference/types"

interface HomeViewProps {
  navigate: Navigate
  categories: Category[]
  categoriesLoading: boolean
  categoriesError: string | null
  onRetryCategories: () => void
}

/* -------------------------------------------------------------------------- */
/*                        Primitives éditoriales locales                      */
/* -------------------------------------------------------------------------- */

/** Révélation sobre au scroll : translation 12 px + fondu, une seule fois. */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** État vide : bordure tiretée, icône journal, message discret. */
function EmptyBlock({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 border border-dashed border-border p-10 text-center",
        className
      )}
    >
      <Newspaper className="size-8 text-zinc-300" aria-hidden="true" />
      <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
    </div>
  )
}

/**
 * Tête de section : kicker rouge (carré de marque) + titrale serif +
 * filet fort. Convention partagée du redesign.
 */
function SectionHeading({
  id,
  label,
  title,
  className,
}: {
  id: string
  label: string
  title: string
  className?: string
}) {
  return (
    <div className={cn("border-b-2 border-foreground pb-3", className)}>
      <p className="kicker flex items-center gap-2 text-brand-red">
        <span aria-hidden="true" className="brand-square bg-brand-red" />
        {label}
      </p>
      <h2
        id={id}
        className="headline mt-1.5 text-2xl font-bold tracking-tight md:text-3xl"
      >
        {title}
      </h2>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            « Le fil » (colonne une)                        */
/* -------------------------------------------------------------------------- */

function FilBlock({
  articles,
  onOpen,
}: {
  articles: ArticleListItem[]
  onOpen: (slug: string) => void
}) {
  return (
    <section aria-labelledby="fil-heading" className="border-t-2 border-foreground pt-4">
      <p id="fil-heading" className="kicker flex items-center gap-2 text-brand-red">
        <span aria-hidden="true" className="brand-square bg-brand-red" />
        Le fil
      </p>
      <ol className="mt-1 divide-y divide-border">
        {articles.map((article, index) => (
          <li key={article.id}>
            <button
              type="button"
              onClick={() => onOpen(article.slug)}
              className="group flex w-full items-start gap-3 py-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
            >
              <span
                aria-hidden="true"
                className="editorial-num w-8 shrink-0 text-xl text-brand-blue"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: article.category.color }}
                >
                  {article.category.name}
                </span>
                <span className="headline mt-0.5 line-clamp-2 block text-sm font-semibold leading-snug transition-colors duration-300 group-hover:text-brand-blue">
                  {article.title}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                    Sommaire : index des rubriques (01-08)                  */
/* -------------------------------------------------------------------------- */

function CategoryIndex({
  categories,
  onOpen,
}: {
  categories: Category[]
  onOpen: (slug: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category, index) => {
        const Icon = getCategoryIcon(category.icon)
        return (
          <motion.button
            key={category.slug}
            type="button"
            onClick={() => onOpen(category.slug)}
            aria-label={`Explorer la rubrique ${category.name} — ${category.articleCount} article${category.articleCount > 1 ? "s" : ""}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(index * 0.05, 0.3) }}
            className="group relative flex flex-col items-start gap-2.5 bg-background p-5 text-left outline-none transition-colors duration-300 hover:bg-paper focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 dark:hover:bg-muted/60"
          >
            {/* Barre de rubrique : apparaît au survol */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ backgroundColor: category.color }}
            />
            <span className="flex w-full items-start justify-between gap-2">
              <span aria-hidden="true" className="editorial-num text-2xl text-zinc-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon
                className="size-[18px] shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
                style={{ color: category.color }}
                aria-hidden="true"
              />
            </span>
            <span className="headline text-lg font-bold leading-tight tracking-tight transition-colors duration-300 group-hover:text-brand-blue">
              {category.name}
            </span>
            <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {category.description}
            </span>
            <span className="kicker mt-auto inline-flex items-center gap-1.5 pt-2 text-zinc-500 transition-colors duration-300 group-hover:text-brand-blue">
              {category.articleCount} article{category.articleCount > 1 ? "s" : ""}
              <ArrowUpRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                     Encart newsletter de la colonne droite                 */
/* -------------------------------------------------------------------------- */

function NewsletterSidebar() {
  return (
    <section aria-labelledby="sidebar-newsletter" className="border-t-2 border-foreground pt-4">
      <div aria-hidden="true" className="rule-brand h-1 w-16" />
      <h2
        id="sidebar-newsletter"
        className="headline mt-3 text-xl font-bold tracking-tight"
      >
        La lettre hebdomadaire
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Un résumé hebdomadaire de nos meilleurs dossiers, sans bruit.
      </p>
      <div className="mt-4">
        <NewsletterForm />
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  HomeView                                  */
/* -------------------------------------------------------------------------- */

export function HomeView({
  navigate,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
}: HomeViewProps) {
  const { t } = useI18n()
  const featured = useI18nFetch<ArticlesResponse>(
    "/api/articles?featured=true&pageSize=6"
  )
  const recent = usePagedArticles({ sort: "recent", pageSize: 9 })

  /** Ouvre un article depuis une carte (signature (slug) => void). */
  const openArticle = React.useCallback(
    (slug: string) => navigate({ type: "article", slug }),
    [navigate]
  )
  /** Ouvre une catégorie depuis une carte (signature (slug) => void). */
  const openCategory = React.useCallback(
    (slug: string) => navigate({ type: "category", slug }),
    [navigate]
  )

  const heroArticles = featured.data?.articles ?? []
  /** « Le fil » : articles récents hors une, sous le carrousel. */
  const filArticles = (recent.data?.articles ?? [])
    .filter((article) => !heroArticles.some((h) => h.slug === article.slug))
    .slice(0, 3)

  return (
    <div>
      {/* --------------------------- Bannière pub ----------------------------- */}
      <AdSlot slot="leaderboard" navigate={navigate} className="pt-6" />

      {/* ------------------------------- À la une ----------------------------- */}
      <section
        aria-label={t("home.featured")}
        className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 md:pt-10"
      >
        <div className="mb-5 flex items-center gap-3 md:mb-6">
          <span aria-hidden="true" className="brand-square bg-brand-red" />
          <p className="kicker text-brand-red">{t("home.featured")}</p>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>

        {featured.loading ? (
          <div className="grid gap-6 lg:grid-cols-12" aria-hidden="true">
            <Skeleton className="aspect-[16/10] lg:col-span-7 lg:aspect-auto lg:min-h-[30rem]" />
            <div className="flex flex-col gap-6 lg:col-span-5">
              <Skeleton className="aspect-[16/9]" />
              <Skeleton className="aspect-[16/9]" />
              <div className="space-y-4 border-t-2 border-foreground pt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-6 w-8" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-2.5 w-20" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : featured.error ? (
          <ErrorState message={featured.error} onRetry={featured.retry} />
        ) : heroArticles.length === 0 ? (
          <EmptyBlock message={t("home.featuredEmpty")} />
        ) : (
          <Reveal className="space-y-6">
            {/* Défilement de TOUS les articles à la une (boucle automatique). */}
            <FeaturedCarousel articles={heroArticles} onOpen={openArticle} />
            {filArticles.length > 0 ? (
              <FilBlock articles={filArticles} onOpen={openArticle} />
            ) : null}
          </Reveal>
        )}
      </section>

      {/* ------------------------------- Sommaire ----------------------------- */}
      <section
        aria-labelledby="categories-heading"
        className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 md:pt-16"
      >
        <SectionHeading
          id="categories-heading"
          label={t("home.summary")}
          title={t("home.exploreCategories")}
        />
        {categoriesLoading ? (
          <div
            className="mt-6 grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4"
            aria-hidden="true"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 border-0 bg-background" />
            ))}
          </div>
        ) : categoriesError ? (
          <ErrorState
            className="mt-6"
            message={categoriesError}
            onRetry={onRetryCategories}
          />
        ) : categories.length === 0 ? (
          <EmptyBlock
            className="mt-6"
            message="Aucune rubrique disponible pour le moment."
          />
        ) : (
          <div className="mt-6">
            <CategoryIndex categories={categories} onOpen={openCategory} />
          </div>
        )}
      </section>

      {/* --------------------- En continu + colonne latérale ------------------ */}
      <section
        aria-labelledby="latest-heading"
        className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 md:pt-16"
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <SectionHeading
              id="latest-heading"
              label={t("home.continuous")}
              title={t("home.latest")}
            />
            {recent.loading ? (
              <div className="divide-y divide-border" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 py-6 md:gap-6">
                    <Skeleton className="aspect-[4/3] w-40 shrink-0 md:w-56" />
                    <div className="flex-1 space-y-2.5 pt-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-5 w-3/5" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recent.error && !recent.data ? (
              <ErrorState
                className="mt-6"
                message={recent.error}
                onRetry={recent.retry}
              />
            ) : recent.data && recent.data.articles.length > 0 ? (
              <>
                <Reveal className="divide-y divide-border">
                  {recent.data.articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="large"
                      onOpen={openArticle}
                      className="py-6"
                    />
                  ))}
                </Reveal>
                {recent.error ? (
                  <p role="alert" className="mt-4 text-sm text-destructive">
                    {recent.error}{" "}
                    <button
                      type="button"
                      onClick={recent.loadMore}
                      className="font-medium text-brand-blue underline-offset-4 hover:underline"
                    >
                      Réessayer
                    </button>
                  </p>
                ) : null}
                {recent.hasMore ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={recent.loadMore}
                      disabled={recent.loadingMore}
                      className="kicker inline-flex min-h-11 items-center justify-center gap-2 border-2 border-[#0a1e3c] px-8 text-[#0a1e3c] outline-none transition-colors duration-300 hover:bg-[#0a1e3c] hover:text-white focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60 dark:border-zinc-300 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-900"
                    >
                      {recent.loadingMore ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          Chargement…
                        </>
                      ) : (
                        "Charger plus"
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="mt-8 flex items-center justify-center gap-2 border-t pt-6 text-sm text-muted-foreground">
                    <Newspaper className="size-4" aria-hidden="true" />
                    Vous avez vu tous les articles récents.
                  </p>
                )}
              </>
            ) : (
              <EmptyBlock
                className="mt-6"
                message="Aucun article publié pour le moment — revenez bientôt."
              />
            )}
          </div>

          {/* Colonne latérale */}
          <aside className="lg:col-span-4">
            <div className="flex flex-col gap-8 lg:sticky lg:top-20">
              <TrendingList onOpen={openArticle} />
              <FactWidget />
              <NewsletterSidebar />
              <AdSlot slot="sidebar" navigate={navigate} />
            </div>
          </aside>
        </div>
      </section>

      {/* --------------------------- Bannière billboard ----------------------- */}
      <AdSlot slot="billboard" navigate={navigate} className="mt-16" />

      {/* --------------------------- Bande newsletter ------------------------- */}
      <section
        aria-labelledby="newsletter-band"
        className="band-navy mt-16 text-white"
      >
        <div aria-hidden="true" className="rule-brand h-1" />
        <Reveal className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="kicker flex items-center gap-2 text-zinc-400">
              <span aria-hidden="true" className="brand-square bg-brand-red" />
              Newsletter
            </p>
            <h2
              id="newsletter-band"
              className="headline mt-3 text-3xl font-bold leading-tight tracking-tight md:text-5xl"
            >
              Comprendre le monde,{" "}
              <em className="italic text-[#8fb4f2]">article par article.</em>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-300 md:text-base">
              Recevez chaque semaine une sélection de dossiers rigoureux, clairs
              et sourcés. Zéro spam, désinscription en un clic.
            </p>
          </div>
          <div className="w-full lg:w-96 lg:justify-self-end">
            <NewsletterForm variant="onBlue" />
          </div>
        </Reveal>
      </section>
    </div>
  )
}
