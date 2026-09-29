import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  categoryPatchSchema,
  categorySlugTakenElsewhere,
  invalidBody,
  mapAdminCategory,
  noContent,
  readJsonBody,
  slugify,
} from "../../_lib"

export const dynamic = "force-dynamic"

/** PATCH /api/admin/categories/[id] — met à jour une rubrique (slug unique hors self). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = categoryPatchSchema.safeParse(body.data)
    if (!parsed.success) {
      return invalidBody(parsed.error, "Rubrique invalide")
    }

    const data = parsed.data
    const current = await db.category.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json(
        { error: "Rubrique introuvable" },
        { status: 404 }
      )
    }

    // Slug fourni → normalisé ; collision avec une autre rubrique → 400.
    let slug: string | undefined
    if (data.slug !== undefined) {
      slug = slugify(data.slug)
      if (
        slug !== current.slug &&
        (await categorySlugTakenElsewhere(slug, id))
      ) {
        return NextResponse.json(
          { error: "Ce slug est déjà utilisé" },
          { status: 400 }
        )
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        color: data.color,
        icon: data.icon,
        image: data.image,
        order: data.order,
      },
      include: { _count: { select: { articles: true } } },
    })

    return NextResponse.json({ category: mapAdminCategory(category) })
  } catch (error) {
    console.error("PATCH /api/admin/categories/[id]", error)
    return NextResponse.json(
      { error: "Impossible de modifier la rubrique" },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/categories/[id] — refuse si la rubrique contient des articles. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const category = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { articles: true } } },
    })
    if (!category) {
      return NextResponse.json(
        { error: "Rubrique introuvable" },
        { status: 404 }
      )
    }

    if (category._count.articles > 0) {
      return NextResponse.json(
        { error: "Cette rubrique contient encore des articles" },
        { status: 400 }
      )
    }

    await db.category.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id]", error)
    return NextResponse.json(
      { error: "Impossible de supprimer la rubrique" },
      { status: 500 }
    )
  }
}
