/**
 * REFERENCE.COM — Helpers API partagés : sérialisation des articles.
 * Le contrat JSON du frontend est défini dans src/components/reference/types.ts.
 */
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import type { NextRequest } from "next/server"

export const articleInclude = {
  category: { select: { slug: true, name: true, color: true } },
  author: { select: { name: true, role: true, initials: true, color: true, bio: true } },
} satisfies Prisma.ArticleInclude

export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleInclude
}>

/** Article complet → DTO de liste (sans content). */
export function toListItem(article: ArticleWithRelations) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    tags: article.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    readMinutes: article.readMinutes,
    views: article.views,
    featured: article.featured,
    publishedAt: article.publishedAt.toISOString(),
    category: article.category,
    author: {
      name: article.author.name,
      role: article.author.role,
      initials: article.author.initials,
      color: article.author.color,
    },
  }
}

/** Article complet → DTO détaillé (avec content, updatedAt et bio de l'auteur). */
export function toFullItem(article: ArticleWithRelations) {
  return {
    ...toListItem(article),
    content: article.content,
    updatedAt: article.updatedAt.toISOString(),
    author: {
      ...toListItem(article).author,
      bio: article.author.bio,
    },
  }
}

/** Paramètres de liste partagés (?category=…&q=…&sort=…&page=…&pageSize=…). */
export interface ListParams {
  category?: string | null
  q?: string | null
  sort: "recent" | "popular"
  featured: boolean
  page: number
  pageSize: number
}

export function parseListParams(request: NextRequest): ListParams {
  const sp = request.nextUrl.searchParams
  const sortParam = sp.get("sort")
  const pageParam = Number.parseInt(sp.get("page") ?? "1", 10)
  const sizeParam = Number.parseInt(sp.get("pageSize") ?? "12", 10)

  return {
    category: sp.get("category")?.trim() || null,
    q: sp.get("q")?.trim() || null,
    sort: sortParam === "popular" ? "popular" : "recent",
    featured: sp.get("featured") === "true",
    page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
    pageSize:
      Number.isFinite(sizeParam) && sizeParam > 0
        ? Math.min(sizeParam, 48)
        : 12,
  }
}
