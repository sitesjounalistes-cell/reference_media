import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { langParam, toListItem } from "@/lib/reference-api"
import { translateLabels, translateMany } from "@/lib/translate"

export const dynamic = "force-dynamic"

/** GET /api/trending?limit=5 — les articles les plus lus. ?lang= traduit. */
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

    const items = articles.map(toListItem)

    const lang = langParam(request)
    if (lang !== "fr" && items.length > 0) {
      const [translations, categoryLabels] = await Promise.all([
        translateMany(articles, lang, false),
        translateLabels(
          Array.from(new Set(articles.map((row) => row.category.name))),
          lang
        ),
      ])
      for (const item of items) {
        const translated = translations.get(item.id)
        if (translated) {
          item.title = translated.title
          item.excerpt = translated.excerpt
        }
        const categoryName = categoryLabels.get(item.category.name)
        if (categoryName) {
          item.category = { ...item.category, name: categoryName }
        }
      }
    }

    return NextResponse.json({ articles: items })
  } catch (error) {
    console.error("GET /api/trending", error)
    return NextResponse.json(
      { error: "Impossible de charger les tendances" },
      { status: 500 }
    )
  }
}
