import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  categoryInputSchema,
  categorySlugTaken,
  categorySlugTakenElsewhere,
  invalidBody,
  mapAdminCategory,
  readJsonBody,
  resolveUniqueSlug,
  slugify,
} from "../_lib"

export const dynamic = "force-dynamic"

/** GET /api/admin/categories — toutes les rubriques, dans l'ordre éditorial. */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const rows = await db.category.findMany({
      orderBy: [{ order: "asc" }],
      include: { _count: { select: { articles: true } } },
    })

    return NextResponse.json({ categories: rows.map(mapAdminCategory) })
  } catch (error) {
    console.error("GET /api/admin/categories", error)
    return NextResponse.json(
      { error: "Impossible de charger les rubriques" },
      { status: 500 }
    )
  }
}

/** POST /api/admin/categories — crée une rubrique (slug auto + unicité). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = categoryInputSchema.safeParse(body.data)
    if (!parsed.success) {
      return invalidBody(parsed.error, "Rubrique invalide")
    }

    const data = parsed.data

    // Slug explicite → normalisé + collision interdite (400) ;
    // slug absent → généré depuis le nom avec suffixes -2, -3, …
    let slug: string
    if (data.slug !== undefined) {
      slug = slugify(data.slug)
      if (await categorySlugTaken(slug)) {
        return NextResponse.json(
          { error: "Ce slug est déjà utilisé" },
          { status: 400 }
        )
      }
    } else {
      slug = await resolveUniqueSlug(data.name, categorySlugTaken)
    }

    let order = data.order
    if (order === undefined) {
      const agg = await db.category.aggregate({ _max: { order: true } })
      order = (agg._max.order ?? 0) + 1
    }

    const category = await db.category.create({
      data: {
        slug,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        image: data.image ?? null,
        order,
      },
      include: { _count: { select: { articles: true } } },
    })

    return NextResponse.json(
      { category: mapAdminCategory(category) },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/admin/categories", error)
    return NextResponse.json(
      { error: "Impossible de créer la rubrique" },
      { status: 500 }
    )
  }
}
