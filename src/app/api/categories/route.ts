import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/** GET /api/categories — toutes les catégories avec leur nombre d'articles. */
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { articles: true } } },
    })

    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
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
