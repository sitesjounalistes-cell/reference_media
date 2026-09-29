import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import {
  articleInputSchema,
  articleSlugTaken,
  invalidBody,
  mapAdminArticle,
  readJsonBody,
  resolveUniqueSlug,
  slugify,
} from "../_lib"

export const dynamic = "force-dynamic"

const ARTICLE_STATUSES = new Set(["DRAFT", "PUBLISHED", "HIDDEN"])

/**
 * GET /api/admin/articles — tous les articles (tous statuts), corpus < 200.
 * ?status=DRAFT|PUBLISHED|HIDDEN|all (défaut all) — ?q=recherche (title/excerpt/tags).
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get("status") ?? "all"
    const q = (searchParams.get("q") ?? "").trim().toLowerCase()

    const rows = await db.article.findMany({
      where: ARTICLE_STATUSES.has(statusParam)
        ? { status: statusParam }
        : undefined,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        category: { select: { slug: true, name: true, color: true } },
        author: { select: { name: true } },
      },
    })

    const filtered = q
      ? rows.filter(
          (row) =>
            row.title.toLowerCase().includes(q) ||
            row.excerpt.toLowerCase().includes(q) ||
            row.tags.toLowerCase().includes(q)
        )
      : rows

    return NextResponse.json({
      articles: filtered.map(mapAdminArticle),
      total: filtered.length,
    })
  } catch (error) {
    console.error("GET /api/admin/articles", error)
    return NextResponse.json(
      { error: "Impossible de charger les articles" },
      { status: 500 }
    )
  }
}

/** POST /api/admin/articles — crée un article (brouillon par défaut). */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await readJsonBody(request)
    if (!body.ok) return body.response

    const parsed = articleInputSchema.safeParse(body.data)
    if (!parsed.success) return invalidBody(parsed.error, "Article invalide")

    const data = parsed.data

    const [category, author] = await Promise.all([
      db.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      }),
      db.author.findUnique({ where: { id: data.authorId }, select: { id: true } }),
    ])
    if (!category) {
      return NextResponse.json({ error: "Rubrique inconnue" }, { status: 400 })
    }
    if (!author) {
      return NextResponse.json({ error: "Auteur inconnu" }, { status: 400 })
    }

    // Slug explicite → normalisé + collision interdite (400).
    // Slug absent → généré depuis le titre avec suffixes -2, -3, …
    let slug: string
    if (data.slug !== undefined) {
      slug = slugify(data.slug)
      if (await articleSlugTaken(slug)) {
        return NextResponse.json(
          { error: "Ce slug est déjà utilisé" },
          { status: 400 }
        )
      }
    } else {
      slug = await resolveUniqueSlug(data.title, articleSlugTaken)
    }

    const article = await db.article.create({
      data: {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage ?? null,
        videoUrl: data.videoUrl ?? null,
        status: data.status,
        categoryId: data.categoryId,
        authorId: data.authorId,
        tags: (data.tags ?? [])
          .map((tag) => tag.trim())
          .filter(Boolean)
          .join(","),
        readMinutes: data.readMinutes,
        featured: data.featured,
      },
      include: {
        category: { select: { slug: true, name: true, color: true } },
        author: { select: { name: true } },
      },
    })

    return NextResponse.json(
      { article: mapAdminArticle(article) },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/admin/articles", error)
    return NextResponse.json(
      { error: "Impossible de créer l'article" },
      { status: 500 }
    )
  }
}
