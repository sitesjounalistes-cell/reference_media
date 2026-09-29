import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * POST /api/articles/[slug]/view — incrémente le compteur de vues.
 * Seuls les articles PUBLISHED sont comptabilisés (les brouillons et articles
 * masqués ne doivent pas gonfler les statistiques). Limité : 60 / min / IP.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const limit = rateLimit(`view:${clientIp(request)}`, 60, 60 * 1000)
    if (!limit.ok) return tooManyRequests(limit.retryAfterS)

    const article = await db.article.findUnique({
      where: { slug },
      select: { id: true, status: true },
    })
    if (!article || article.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 })
    }

    const updated = await db.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
      select: { views: true },
    })

    return NextResponse.json({ views: updated.views })
  } catch (error) {
    console.error("POST /api/articles/[slug]/view", error)
    return NextResponse.json(
      { error: "Impossible d'enregistrer la vue" },
      { status: 500 }
    )
  }
}
