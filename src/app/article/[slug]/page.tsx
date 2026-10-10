import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { db } from "@/lib/db"

/**
 * REFERENCE.COM — URL publique et partageable d'un article : /article/[slug].
 * Émet les métadonnées Open Graph/Twitter de l'article (titre, chapô, image)
 * pour WhatsApp, Facebook, LinkedIn, puis ouvre l'application sur l'article.
 *
 * Note : pas de <html>/<body> ici — le layout racine les fournit déjà.
 */

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://reference-media.vercel.app"
).replace(/\/$/, "")

function absoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (path.startsWith("http")) return path
  return `${SITE_URL}${path}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await db.article
    .findUnique({
      where: { slug },
      select: { title: true, excerpt: true, coverImage: true, status: true },
    })
    .catch(() => null)

  if (!article || article.status !== "PUBLISHED") {
    return { title: "Article introuvable — REFERENCE.COM", robots: { index: false } }
  }

  const image = absoluteUrl(article.coverImage)
  const url = `${SITE_URL}/article/${slug}`

  return {
    title: `${article.title} — REFERENCE.COM`,
    description: article.excerpt,
    alternates: { canonical: `/article/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      url,
      siteName: "REFERENCE.COM",
      locale: "fr_FR",
      ...(image ? { images: [{ url: image, width: 1200, height: 675 }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: article.title,
      description: article.excerpt,
      ...(image ? { images: [image] } : {}),
    },
  }
}

/** Ouvre l'application sur cet article (l'URL partagée reste inchangée). */
function OpenArticle({ slug }: { slug: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.location.replace("/?article=${encodeURIComponent(slug)}");`,
      }}
    />
  )
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await db.article
    .findUnique({ where: { slug }, select: { status: true } })
    .catch(() => null)

  if (!article || article.status !== "PUBLISHED") {
    redirect("/?article=" + encodeURIComponent(slug))
  }

  return (
    <section
      style={{
        margin: 0,
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f2ec",
        color: "#0a1e3c",
        fontFamily: "Georgia, serif",
      }}
    >
      <p style={{ fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        REFERENCE.COM — ouverture de l'article…
      </p>
      <OpenArticle slug={slug} />
    </section>
  )
}
