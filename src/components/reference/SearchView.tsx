"use client"

import * as React from "react"

import { motion } from "framer-motion"
import { ArrowUpRight, Search } from "lucide-react"

import { formatDateShort } from "@/components/reference/lib"
import { useI18n, useI18nFetch } from "@/components/reference/lang-context"
import { usePagedArticles } from "@/components/reference/use-paged-articles"
import { ErrorState } from "@/components/reference/ErrorState"
import { SmartImage } from "@/components/reference/SmartImage"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ArticleListItem,
  ArticlesResponse,
  Category,
  Navigate,
  SortKey,
} from "@/components/reference/types"

interface SearchViewProps {
  q: string
  navigate: Navigate
  categories: Category[]
}

/* -------------------------------------------------------------------------- */
/*                            Rangée de résultat                              */
/* -------------------------------------------------------------------------- */

/** Rangée hairline : vignette 4/3, kicker rubrique, titre, extrait, date. */
function ResultRow({
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
      transition={{ duration: 0.3 }}
      className="py-5"
    >
      <button
        type="button"
        onClick={() => onOpen(article.slug)}
        className="group flex w-full items-start gap-5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="img-zoom block aspect-[4/3] w-28 shrink-0 border border-border bg-muted sm:w-36">
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
          <span className="mt-2.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {formatDateShort(article.publishedAt)} · {article.author.name} ·{" "}
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

/** Bouton bordé « suggestion de rubrique ». */
function CategorySuggestion({
  category,
  onSelect,
}: {
  category: Category
  onSelect: (slug: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category.slug)}
      className="inline-flex min-h-11 items-center gap-2 border border-border bg-background px-4 text-sm font-semibold outline-none transition-colors hover:border-[#0a1e3c] hover:bg-[#0a1e3c] hover:text-white focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
      <span className="text-xs tabular-nums opacity-70">{category.articleCount}</span>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 SearchView                                 */
/* -------------------------------------------------------------------------- */

/** Vue « recherche » : en-tête papier, rangées hairline, état vide accentué. */
export function SearchView({ q, navigate, categories }: SearchViewProps) {
  const [input, setInput] = React.useState(q)
  const [query, setQuery] = React.useState(q)
  const [sort, setSort] = React.useState<SortKey>("recent")
  const { t } = useI18n()

  // Synchronise quand la vue est ouverte depuis la barre de recherche.
  React.useEffect(() => {
    setInput(q)
    setQuery(q)
  }, [q])

  const results = usePagedArticles({ q: query || undefined, sort, pageSize: 12 })
  const suggestions = useI18nFetch<ArticlesResponse>(
    query ? null : "/api/trending?limit=5"
  )

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setQuery(input.trim())
  }

  const openArticle = React.useCallback(
    (slug: string) => navigate({ type: "article", slug }),
    [navigate]
  )
  const openCategory = React.useCallback(
    (slug: string) => navigate({ type: "category", slug }),
    [navigate]
  )

  const hasQuery = query.length > 0
  const total = results.data?.total ?? null

  return (
    <div className="pb-4">
      {/* --------------------------- En-tête papier --------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="band-paper border-b border-zinc-200"
      >
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c8102c]">
            <span aria-hidden="true" className="size-2 shrink-0 bg-brand-red" />
            {t("search.title")}
          </p>
          <h1 className="headline mt-3 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
            {hasQuery ? (
              results.loading ? (
                t("search.loading")
              ) : total !== null ? (
                <>
                  <span className="tabular-nums">{total}</span>{" "}
                  {t("search.resultsWord")} {t("search.resultsForWord")}{" "}
                  <span className="text-brand-blue">« {query} »</span>
                </>
              ) : (
                <>
                  {t("search.resultsForWord")}{" "}
                  <span className="text-brand-blue">« {query} »</span>
                </>
              )
            ) : (
              t("search.prompt")
            )}
          </h1>
          <form onSubmit={submit} className="mt-6 flex max-w-xl gap-2" role="search">
            <label htmlFor="search-view-input" className="sr-only">
              {t("search.label")}
            </label>
            <input
              id="search-view-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("search.placeholderExamples")}
              autoComplete="off"
              className="h-11 min-h-11 flex-1 border-2 border-zinc-300 bg-white px-3.5 text-[15px] text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-brand-blue focus-visible:ring-[3px] focus-visible:ring-brand-blue/30"
            />
            <button
              type="submit"
              className="inline-flex h-11 min-h-11 items-center gap-2 bg-[#0a1e3c] px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-white outline-none transition-colors hover:bg-brand-blue focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Rechercher</span>
            </button>
          </form>
        </div>
      </motion.div>

      {/* ------------------------------ Résultats ----------------------------- */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {hasQuery ? (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {results.loading
                  ? t("search.loading")
                  : results.data
                    ? `${results.data.total} ${t("search.resultsWord")}`
                    : null}
              </p>
              <Tabs value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <TabsList>
                  <TabsTrigger value="recent">{t("category.recent")}</TabsTrigger>
                  <TabsTrigger value="popular">{t("category.popular")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {results.loading ? (
              <div className="mt-6 space-y-4" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-36" />
                ))}
              </div>
            ) : results.error && !results.data ? (
              <ErrorState
                className="mt-6"
                message={results.error}
                onRetry={results.retry}
              />
            ) : results.data && results.data.articles.length > 0 ? (
              <div className="mt-2 divide-y divide-border border-b border-border">
                {results.data.articles.map((article) => (
                  <ResultRow key={article.id} article={article} onOpen={openArticle} />
                ))}
              </div>
            ) : (
              /* État vide : bordure tiretée + suggestions de rubriques */
              <div className="mt-8 flex flex-col items-center gap-4 border border-dashed p-10 text-center">
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center border-2 border-brand-red text-brand-red"
                >
                  <Search className="size-5" />
                </span>
                <div>
                  <p className="headline text-lg font-bold">
                    {t("search.noneFor", { query })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("search.spellHint")}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.map((category) => (
                    <CategorySuggestion
                      key={category.slug}
                      category={category}
                      onSelect={openCategory}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ------------------------ État initial (vide) ----------------------- */
          <motion.section
            aria-labelledby="suggestions-heading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="pt-10"
          >
            <div className="flex items-end justify-between gap-4 border-b-2 border-foreground pb-3">
              <div>
                <p className="kicker flex items-center gap-2 text-brand-red">
                  <span aria-hidden="true" className="brand-square bg-brand-red" />
                  Suggestions
                </p>
                <h2
                  id="suggestions-heading"
                  className="headline mt-1.5 text-xl font-bold tracking-tight md:text-2xl"
                >
                  Les articles les plus lus
                </h2>
              </div>
            </div>
            {suggestions.loading ? (
              <div className="mt-6 space-y-4" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : suggestions.data && suggestions.data.articles.length > 0 ? (
              <div className="mt-2 divide-y divide-border border-b border-border">
                {suggestions.data.articles.map((article) => (
                  <ResultRow
                    key={article.id}
                    article={article}
                    onOpen={openArticle}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Lancez une recherche pour explorer nos dossiers.
              </p>
            )}

            <div className="mt-12 border-b-2 border-foreground pb-3">
              <p className="kicker flex items-center gap-2 text-brand-red">
                <span aria-hidden="true" className="brand-square bg-brand-red" />
                Explorer
              </p>
              <h2 className="headline mt-1.5 text-xl font-bold tracking-tight md:text-2xl">
                Ou parcourez les rubriques
              </h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <CategorySuggestion
                  key={category.slug}
                  category={category}
                  onSelect={openCategory}
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
