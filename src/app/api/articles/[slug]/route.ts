import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { toFullItem, toListItem } from "@/lib/reference-api"

export const dynamic = "force-dynamic"

/**
 * GET /api/articles/[slug] — article complet + 3 articles liés.
 * ?preview=1 contourne le statut (aperçu cockpit), mais uniquement avec une
 * session administrateur valide : sinon les brouillons et articles masqués
 * restent invisibles au public.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    let preview = false
    if (new URL(request.url).searchParams.get("preview") === "1") {
      preview = (await requireAdmin(request)) === null
    }

    const article = await db.article.findUnique({
      where: { slug },
      include: {
        category: { select: { slug: true, name: true, color: true } },
        author: {
          select: { name: true, role: true, initials: true, color: true, bio: true },
        },
      },
    })

    if (!article || (article.status !== "PUBLISHED" && !preview)) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 })
    }

    const related = await db.article.findMany({
      where: { categoryId: article.categoryId, id: { not: article.id }, status: "PUBLISHED" },
      orderBy: [{ views: "desc" }],
      take: 3,
      include: {
        category: { select: { slug: true, name: true, color: true } },
        author: {
          select: { name: true, role: true, initials: true, color: true, bio: true },
        },
      },
    })

    return NextResponse.json({
      article: toFullItem(article),
      related: related.map(toListItem),
    })
  } catch (error) {
    console.error("GET /api/articles/[slug]", error)
    return NextResponse.json(
      { error: "Impossible de charger l'article" },
      { status: 500 }
    )
  }
}
