"use client"

import * as React from "react"

import { fetchJson } from "@/components/reference/lib"
import { useI18n } from "@/components/reference/lang-context"
import { DEFAULT_LANG } from "@/lib/i18n"
import type { ArticlesResponse, SortKey } from "@/components/reference/types"

export interface PagedArticlesParams {
  sort?: SortKey
  category?: string
  q?: string
  featured?: boolean
  pageSize?: number
}

function buildUrl(params: PagedArticlesParams, page: number, lang: string): string {
  const search = new URLSearchParams()
  if (params.category) search.set("category", params.category)
  if (params.q) search.set("q", params.q)
  if (params.sort) search.set("sort", params.sort)
  if (params.featured) search.set("featured", "true")
  search.set("page", String(page))
  search.set("pageSize", String(params.pageSize ?? 12))
  if (lang !== DEFAULT_LANG) search.set("lang", lang)
  return `/api/articles?${search.toString()}`
}

export interface PagedArticlesState {
  data: ArticlesResponse | null
  error: string | null
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  retry: () => void
  loadMore: () => Promise<void>
}

/**
 * Liste paginée d’articles (« Charger plus ») : recharge la page 1 quand les
 * paramètres changent, ajoute les pages suivantes sans perdre l’existant.
 */
export function usePagedArticles(params: PagedArticlesParams): PagedArticlesState {
  const { lang } = useI18n()
  const key = JSON.stringify(params) + `|${lang}`
  const [data, setData] = React.useState<ArticlesResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [nonce, setNonce] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError(null)
    fetchJson<ArticlesResponse>(buildUrl(params, 1, lang), { signal: controller.signal })
      .then((result) => {
        if (!active) return
        setData(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active || (err instanceof Error && err.name === "AbortError")) return
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
        setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [key, lang, nonce])

  const loadMore = React.useCallback(async () => {
    if (!data || loadingMore) return
    const nextPage = (data.page ?? 1) + 1
    setLoadingMore(true)
    setError(null)
    try {
      const result = await fetchJson<ArticlesResponse>(buildUrl(params, nextPage, lang))
      setData((prev) =>
        prev
          ? { ...result, articles: [...prev.articles, ...result.articles] }
          : result
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoadingMore(false)
    }
  }, [data, key, lang, loadingMore])

  const hasMore = Boolean(data && (data.page ?? 1) < data.totalPages)

  const retry = React.useCallback(() => setNonce((n) => n + 1), [])

  return { data, error, loading, loadingMore, hasMore, retry, loadMore }
}
