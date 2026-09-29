import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  articlePatchSchema,
  articleSlugTakenElsewhere,
  invalidBody,
  mapAdminArticle,
  noContent,
  readJsonBody,
  slugify,
} from "../../_lib"

export const dynamic = "force-dynamic"

/** GET /api/admin/articles/[id] — un article, quel que soit son statut. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const article = await db.article.findUnique({
      where: { id },
      include: {
        category: { select: { slug: true, name: true, color: true } },
        author: { select: { name: true } },
      },
    })
    if (!article) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 })
    }
    return NextResponse.json({ article: mapAdminArticle(article) })
  } catch (error) {
    console.error("GET /api/admin/articles/[id]", error)
    return NextResponse.json(
      { error: "Impossible de charger l'article" },
      { status: 500 }
    )
  }
}

/** PATCH /api/admin/articles/[id] — mise à jour partielle d'un article. */
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

    const parsed = articlePatchSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Article invalide")

    const data = parsed.data
    const current = await db.article.findUnique({ where: { id } })
    if (!current) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 })
    }

    if (data.categoryId !== undefined) {
      const category = await db.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      })
      if (!category) {
        return NextResponse.json(
          { error: "Rubrique inconnue" },
          { status: 400 }
        )
      }
    }

    if (data.authorId !== undefined) {
      const author = await db.author.findUnique({
        where: { id: data.authorId },
        select: { id: true },
      })
      if (!author) {
        return NextResponse.json({ error: "Auteur inconnu" }, { status: 400 })
      }
    }

    // Slug fourni → normalisé ; collision avec un autre article → 400.
    let slug: string | undefined
    if (data.slug !== undefined) {
      slug = slugify(data.slug)
      if (
        slug !== current.slug &&
        (await articleSlugTakenElsewhere(slug, id))
      ) {
        return NextResponse.json(
          { error: "Ce slug est déjà utilisé" },
          { status: 400 }
        )
      }
    }

    const article = await db.article.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        categoryId: data.categoryId,
        authorId: data.authorId,
        tags:
          data.tags !== undefined
            ? data.tags
                .map((tag) => tag.trim())
                .filter(Boolean)
                .join(",")
            : undefined,
        readMinutes: data.readMinutes,
        featured: data.featured,
        status: data.status,
        coverImage: data.coverImage,
        videoUrl: data.videoUrl,
      },
      include: {
        category: { select: { slug: true, name: true, color: true } },
        author: { select: { name: true } },
      },
    })

    return NextResponse.json({ article: mapAdminArticle(article) })
  } catch (error) {
    console.error("PATCH /api/admin/articles/[id]", error)
    return NextResponse.json(
      { error: "Impossible de modifier l'article" },
      { status: 500 }
    )
  }
}

/** DELETE /api/admin/articles/[id] — supprime définitivement l'article. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await db.article.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 })
    }

    await db.article.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error("DELETE /api/admin/articles/[id]", error)
    return NextResponse.json(
      { error: "Impossible de supprimer l'article" },
      { status: 500 }
    )
  }
}
