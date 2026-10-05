import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { langParam } from "@/lib/reference-api"
import { translateLabels } from "@/lib/translate"

export const dynamic = "force-dynamic"

/** GET /api/categories — toutes les catégories avec leur nombre d'articles.
 * ?lang= traduit nom + description (cache mémoire). */
export async function GET(request: Request) {
  try {
    const categories = await db.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { articles: true } } },
    })

    const lang = langParam(request)
    const labels =
      lang === "fr"
        ? null
        : await translateLabels(
            categories.flatMap((category) => [category.name, category.description]),
            lang
          )

    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: labels?.get(category.name) ?? category.name,
        description: labels?.get(category.description) ?? category.description,
        color: category.color,
        icon: category.icon,
        image: category.image,
        articleCount: category._count.articles,
      })),
    })
  } catch (error) {
    console.error("GET /api/categories", error)
    return NextResponse.json(
      { error: "Impossible de charger les catégories" },
      { status: 500 }
    )
  }
}
