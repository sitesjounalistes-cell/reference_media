import { NextResponse, type NextRequest } from "next/server"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { articleInclude, parseListParams, toListItem } from "@/lib/reference-api"

export const dynamic = "force-dynamic"

/**
 * GET /api/articles
 * Params : category (slug), q (plein texte), sort (recent|popular),
 *          page (1-based), pageSize (max 48), featured ("true").
 *
 * Filtre, tri ET pagination entièrement en base (count + skip/take) :
 * le serveur ne charge que la page demandée, jamais le corpus entier.
 * La recherche utilise `contains` avec mode insensible (PostgreSQL ILIKE).
 */
export async function GET(request: NextRequest) {
  try {
    const params = parseListParams(request)

    const where: Prisma.ArticleWhereInput = {
      // Seuls les articles publiés sont visibles sur le site public.
      status: "PUBLISHED",
      ...(params.category ? { category: { is: { slug: params.category } } } : {}),
      ...(params.featured ? { featured: true } : {}),
    }

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: "insensitive" } },
        { excerpt: { contains: params.q, mode: "insensitive" } },
        { content: { contains: params.q, mode: "insensitive" } },
        { tags: { contains: params.q, mode: "insensitive" } },
      ]
    }

    const total = await db.article.count({ where })
    const totalPages = Math.max(Math.ceil(total / params.pageSize), 1)
    const safePage = Math.min(params.page, totalPages)

    const rows = await db.article.findMany({
      where,
      orderBy:
        params.sort === "popular"
          ? [{ views: "desc" }, { publishedAt: "desc" }]
          : [{ publishedAt: "desc" }],
      skip: (safePage - 1) * params.pageSize,
      take: params.pageSize,
      include: articleInclude,
    })

    return NextResponse.json({
      articles: rows.map(toListItem),
      total,
      page: safePage,
      pageSize: params.pageSize,
      totalPages,
    })
  } catch (error) {
    console.error("GET /api/articles", error)
    return NextResponse.json(
      { error: "Impossible de charger les articles" },
      { status: 500 }
    )
  }
}
