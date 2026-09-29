"use client"

import * as React from "react"

import { motion } from "framer-motion"
import { ArrowUpRight, FileText, Loader2, Newspaper } from "lucide-react"

import { formatDateShort } from "@/components/reference/lib"
import { usePagedArticles } from "@/components/reference/use-paged-articles"
import { AdSlot } from "@/components/reference/AdSlot"
import { CategoryPills } from "@/components/reference/CategoryPills"
import { ErrorState } from "@/components/reference/ErrorState"
import { SmartImage } from "@/components/reference/SmartImage"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ArticleListItem,
  Category,
  Navigate,
  SortKey,
} from "@/components/reference/types"

interface CategoryViewProps {
  slug: string
  navigate: Navigate
  categories: Category[]
  categoriesLoading: boolean
  categoriesError: string | null
  onRetryCategories: () => void
}

/* -------------------------------------------------------------------------- */
/*                        Cartes de la rubrique (locales)                     */
/* -------------------------------------------------------------------------- */

/** Article d'ouverture : grande image 16/9 + titre éditorial. */
function LeadArticle({
  article,
  onOpen,
}: {
  article: ArticleListItem
  onOpen: (slug: string) => void
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pt-8"
    >
      <button
        type="button"
        onClick={() => onOpen(article.slug)}
        className="group block w-full text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="img-zoom block aspect-[16/9] w-full border border-border bg-muted">
          <SmartImage
            src={article.coverImage}
            alt=""
            fallbackColor={article.category.color}
            eager
          />
        </span>
        <span className="mx-auto block max-w-3xl">
          <span
            className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: article.category.color }}
          >
            <span
              aria-hidden="true"
              className="size-2 shrink-0"
              style={{ backgroundColor: article.category.color }}
            />
            {article.category.name}
          </span>
          <span className="headline mt-2.5 block text-2xl font-bold leading-[1.12] text-foreground transition-colors group-hover:text-brand-blue group-focus-visible:text-brand-blue md:text-3xl">
            {article.title}
          </span>
          <span className="mt-3 line-clamp-2 block text-[15px] leading-relaxed text-muted-foreground md:text-base">
            {article.excerpt}
          </span>
          <span className="mt-4 block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {article.author.name} · {formatDateShort(article.publishedAt)} ·{" "}
            {article.readMinutes} min de lecture
          </span>
        </span>
      </button>
    </motion.article>
  )
}

/** Rangée hairline : vignette 4/3, kicker, titre, extrait, méta. */
function ArticleRow({
  article,
  onOpen,
}: {
  article: ArticleListItem
  onOpen: (slug: string) => void
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="py-6"
    >
      <button
        type="button"
        onClick={() => onOpen(article.slug)}
        className="group flex w-full items-start gap-5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="img-zoom block aspect-[4/3] w-28 shrink-0 border border-border bg-muted sm:w-40">
          <SmartImage
            src={article.coverImage}
            alt=""
            fallbackColor={article.category.color}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: article.category.color }}
          >
            <span
              aria-hidden="true"
              className="size-2 shrink-0"
              style={{ backgroundColor: article.category.color }}
            />
            {article.category.name}
          </span>
          <span className="headline mt-1.5 block text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-brand-blue group-focus-visible:text-brand-blue">
            {article.title}
          </span>
          <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
            {article.excerpt}
          </span>
          <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {article.author.name} · {formatDateShort(article.publishedAt)} ·{" "}
            {article.readMinutes} min
          </span>
        </span>
        <ArrowUpRight
          className="mt-1 hidden size-5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-brand-blue sm:block"
          aria-hidden="true"
        />
      </button>
    </motion.article>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Squelette chargement                          */
/* -------------------------------------------------------------------------- */

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="pt-8">
      <Skeleton className="aspect-[16/9] w-full" />
      <Skeleton className="mt-6 h-8 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-10 border-t border-border">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-start gap-5 py-6">
            <Skeleton className="aspect-[4/3] w-28 shrink-0 sm:w-40" />
            <div className="w-full space-y-2.5 pt-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 CategoryView                               */
/* -------------------------------------------------------------------------- */

/** Vue « catégorie » : bandeau marine, article d'ouverture, liste hairline. */
export function CategoryView({
  slug,
  navigate,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
}: CategoryViewProps) {
  const [sort, setSort] = React.useState<SortKey>("recent")

  const category = categories.find((c) => c.slug === slug) ?? null

  const articles = usePagedArticles({ category: slug, sort, pageSize: 12 })

  const openArticle = React.useCallback(
    (next: string) => navigate({ type: "article", slug: next }),
    [navigate]
  )
  const openCategory = React.useCallback(
    (next: string) => {
      if (next && next !== slug) navigate({ type: "category", slug: next })
    },
    [navigate, slug]
  )

  const lead = articles.data?.articles[0] ?? null
  const rest = React.useMemo(
    () => articles.data?.articles.slice(1) ?? [],
    [articles.data]
  )

  return (
    <div className="pb-4">
      {/* ---------------------------- Bandeau navy ---------------------------- */}
      <motion.section
        key={slug}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        aria-labelledby="category-title"
      >
        <div className="band-navy">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
            {categoriesLoading ? (
              <div aria-hidden="true" className="space-y-4">
                <Skeleton className="h-3 w-24 bg-white/20" />
                <Skeleton className="h-12 w-72 bg-white/20" />
                <Skeleton className="h-4 w-full max-w-2xl bg-white/20" />
                <Skeleton className="h-3 w-40 bg-white/20" />
              </div>
            ) : category ? (
              <>
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  Rubrique
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <h1
                    id="category-title"
                    className="headline text-4xl font-black text-white md:text-5xl"
                  >
                    {category.name}
                  </h1>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
                  {category.description}
                </p>
                <p className="mt-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  <FileText className="size-3.5" aria-hidden="true" />
                  {category.articleCount} article
                  {category.articleCount > 1 ? "s" : ""}
                </p>
              </>
            ) : categoriesError ? (
              <ErrorState
                message={categoriesError}
                onRetry={onRetryCategories}
                className="border-0 bg-transparent"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="headline text-6xl font-black text-white/20">?</span>
                <h1 id="category-title" className="headline text-2xl font-bold text-white">
                  Rubrique inconnue
                </h1>
                <p className="text-sm text-zinc-300">
                  Cette rubrique n&apos;existe pas (ou plus).
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ type: "home" })}
                  className="mt-2 inline-flex min-h-11 items-center border-2 border-white px-6 text-[11px] font-bold uppercase tracking-[0.16em] text-white outline-none transition-colors hover:bg-white hover:text-[#0a1e3c] focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  Retour à l&apos;accueil
                </button>
              </div>
            )}
          </div>
          {/* Filet bicolore de marque sous l'ensemble du bandeau. */}
          <div aria-hidden="true" className="rule-brand h-1" />
        </div>
      </motion.section>

      {/* --------------------------- Bannière pub ----------------------------- */}
      <AdSlot slot="leaderboard" navigate={navigate} className="pt-6" />

      {/* ------------------------- Filtres + articles ------------------------- */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {categories.length > 0 ? (
          <CategoryPills
            categories={categories}
            activeSlug={slug}
            onSelect={openCategory}
            className="md:max-w-full"
          />
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {articles.data
              ? `${articles.data.total} article${articles.data.total > 1 ? "s" : ""}`
              : "Chargement…"}
          </p>
          <Tabs value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <TabsList>
              <TabsTrigger value="recent">Récent</TabsTrigger>
              <TabsTrigger value="popular">Populaire</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {articles.loading ? (
          <ListSkeleton />
        ) : articles.error && !articles.data ? (
          <ErrorState
            className="mt-8"
            message={articles.error}
            onRetry={articles.retry}
          />
        ) : lead ? (
          <>
            <LeadArticle article={lead} onOpen={openArticle} />

            <div className="mt-8 divide-y divide-border border-t border-border">
              {rest.map((row, index) => (
                <React.Fragment key={row.id}>
                  <ArticleRow article={row} onOpen={openArticle} />
                  {index === 2 ? (
                    <div className="py-6">
                      <AdSlot slot="inline" navigate={navigate} bare />
                    </div>
                  ) : null}
                </React.Fragment>
              ))}
            </div>

            {articles.hasMore ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => void articles.loadMore()}
                  disabled={articles.loadingMore}
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-[#0a1e3c] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0a1e3c] outline-none transition-colors hover:bg-[#0a1e3c] hover:text-white focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60"
                >
                  {articles.loadingMore ? (
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
              <p className="mt-10 flex items-center justify-center gap-2 border-t pt-6 text-sm text-muted-foreground">
                <Newspaper className="size-4" aria-hidden="true" />
                Vous avez exploré toute cette catégorie.
              </p>
            )}
          </>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3 border border-dashed p-10 text-center">
            <Newspaper className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">
              Aucun article dans cette catégorie pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
