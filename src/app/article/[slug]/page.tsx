import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { db } from "@/lib/db"

/**
 * REFERENCE.COM — URL publique et partageable d'un article : /article/[slug].
 * Serve la même application, mais avec les métadonnées Open Graph/Twitter de
 * l'article (titre, chapô, image) — c'est ce que WhatsApp, Facebook, LinkedIn
 * et les autres réseaux affichent lors du partage.
 */

function absoluteUrl(path: string | null | undefined, origin: string): string | undefined {
  if (!path) return undefined
  if (path.startsWith("http")) return path
  return `${origin}${path}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await db.article
    .findUnique({ where: { slug }, select: { title: true, excerpt: true, coverImage: true, status: true } })
    .catch(() => null)

  if (!article || article.status !== "PUBLISHED") {
    return { title: "Article introuvable — REFERENCE.COM" }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? ""
  const image = absoluteUrl(article.coverImage, origin)

  return {
    title: `${article.title} — REFERENCE.COM`,
    description: article.excerpt,
    alternates: { canonical: `/article/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      siteName: "REFERENCE.COM",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: article.title,
      description: article.excerpt,
      ...(image ? { images: [image] } : {}),
    },
  }
}

/** Ouvre l'application sur cet article (l'URL reste partageable telle quelle). */
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
    <html lang="fr">
      <body style={{ margin: 0, background: "#f4f2ec" }}>
        <main
          style={{
            fontFamily: "Georgia, serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "#0a1e3c",
          }}
        >
          <p style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            REFERENCE.COM — ouverture de l'article…
          </p>
        </main>
        <OpenArticle slug={slug} />
      </body>
    </html>
  )
}
