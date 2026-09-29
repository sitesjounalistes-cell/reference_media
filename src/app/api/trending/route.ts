import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { toListItem } from "@/lib/reference-api"

export const dynamic = "force-dynamic"

/** GET /api/trending?limit=5 — les articles les plus lus. */
export async function GET(request: NextRequest) {
  try {
    const limitParam = Number.parseInt(
      request.nextUrl.searchParams.get("limit") ?? "5",
      10
    )
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 10)
        : 5

    const articles = await db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
      take: limit,
      include: {
        category: { select: { slug: true, name: true, color: true } },
        author: {
          select: { name: true, role: true, initials: true, color: true, bio: true },
        },
      },
    })

    return NextResponse.json({ articles: articles.map(toListItem) })
  } catch (error) {
    console.error("GET /api/trending", error)
    return NextResponse.json(
      { error: "Impossible de charger les tendances" },
      { status: 500 }
    )
  }
}
