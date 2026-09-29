import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  authorPatchSchema,
  computeInitials,
  invalidBody,
  mapAdminAuthor,
  noContent,
  readJsonBody,
} from "../../_lib"

export const dynamic = "force-dynamic"

/** PATCH /api/admin/authors/[id] — met à jour un auteur (initiales recalculées si le nom change). */
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

    const parsed = authorPatchSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Auteur invalide")

    const data = parsed.data
    const existing = await db.author.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Auteur introuvable" }, { status: 404 })
    }

    // Initiales fournies → normalisées en majuscules ; sinon recalcul si le nom change.
    let initials: string | undefined
    if (data.initials !== undefined) {
      initials = data.initials.toUpperCase()
    } else if (data.name !== undefined) {
      initials = computeInitials(data.name)
    }

    const author = await db.author.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        bio: data.bio,
        color: data.color,
        initials,
      },
      include: { _count: { select: { articles: true } } },
    })

    return NextResponse.json({ author: mapAdminAuthor(author) })
  } catch (error) {
    console.error("PATCH /api/admin/authors/[id]", error)
    return NextResponse.json(
      { error: "Impossible de modifier l'auteur" },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/authors/[id] — refuse si des articles sont encore attribués. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const author = await db.author.findUnique({
      where: { id },
      include: { _count: { select: { articles: true } } },
    })
    if (!author) {
      return NextResponse.json({ error: "Auteur introuvable" }, { status: 404 })
    }

    if (author._count.articles > 0) {
      return NextResponse.json(
        { error: "Cet auteur a encore des articles attribués" },
        { status: 400 }
      )
    }

    await db.author.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error("DELETE /api/admin/authors/[id]", error)
    return NextResponse.json(
      { error: "Impossible de supprimer l'auteur" },
      { status: 500 }
    )
  }
}
