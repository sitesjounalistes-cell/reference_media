import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { langParam, toFullItem, toListItem } from "@/lib/reference-api"
import { translateArticle, translateLabels, translateMany } from "@/lib/translate"

export const dynamic = "force-dynamic"

/**
 * GET /api/articles/[slug] — article complet + 3 articles liés.
 * ?preview=1 contourne le statut (aperçu cockpit), mais uniquement avec une
 * session administrateur valide : sinon les brouillons et articles masqués
 * restent invisibles au public.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    let preview = false
    if (new URL(request.url).searchParams.get("preview") === "1") {
      preview = (await requireAdmin(request)) === null
    }

    const article = await db.article.findUnique({
      where: { slug },
      include: {
        category: { select: { slug: true, name: true, color: true } },
        author: {
          select: { name: true, role: true, initials: true, color: true, bio: true },
        },
      },
    })

    if (!article || (article.status !== "PUBLISHED" && !preview)) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 })
    }

    const related = await db.article.findMany({
      where: { categoryId: article.categoryId, id: { not: article.id }, status: "PUBLISHED" },
      orderBy: [{ views: "desc" }],
      take: 3,
      include: {
        category: { select: { slug: true, name: true, color: true } },
        author: {
          select: { name: true, role: true, initials: true, color: true, bio: true },
        },
      },
    })

    const articleDto = toFullItem(article)
    const relatedItems = related.map(toListItem)

    // Traduction complète à la demande (titre, chapô, contenu, rubrique, tags).
    const lang = langParam(request)
    if (lang !== "fr") {
      const tags = article.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
      const [full, relatedTranslations, labels] = await Promise.all([
        translateArticle(article, lang, true),
        translateMany(related, lang, false),
        translateLabels(
          Array.from(
            new Set([article.category.name, ...related.map((row) => row.category.name), ...tags])
          ),
          lang
        ),
      ])

      articleDto.title = full.title
      articleDto.excerpt = full.excerpt
      articleDto.content = full.content
      articleDto.category = {
        ...articleDto.category,
        name: labels.get(article.category.name) ?? article.category.name,
      }
      articleDto.tags = tags.map((tag) => labels.get(tag) ?? tag)

      for (const item of relatedItems) {
        const translated = relatedTranslations.get(item.id)
        if (translated) {
          item.title = translated.title
          item.excerpt = translated.excerpt
        }
        const categoryName = labels.get(item.category.name)
        if (categoryName) item.category = { ...item.category, name: categoryName }
      }
    }

    return NextResponse.json({
      article: articleDto,
      related: relatedItems,
    })
  } catch (error) {
    console.error("GET /api/articles/[slug]", error)
    return NextResponse.json(
      { error: "Impossible de charger l'article" },
      { status: 500 }
    )
  }
}
