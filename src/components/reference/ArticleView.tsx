"use client"

import * as React from "react"

import ReactMarkdown from "react-markdown"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Eye,
  Facebook,
  Home,
  Link2,
  Linkedin,
  Mail,
  RotateCw,
} from "lucide-react"

import {
  formatDate,
  formatDateShort,
  formatViews,
  useFetch,
} from "@/components/reference/lib"
import { AdSlot } from "@/components/reference/AdSlot"
import { ErrorState } from "@/components/reference/ErrorState"
import { SmartImage } from "@/components/reference/SmartImage"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import type {
  ArticleListItem,
  ArticleResponse,
  Navigate,
} from "@/components/reference/types"

interface ArticleViewProps {
  slug: string
  navigate: Navigate
  /** Aperçu cockpit : charge aussi les brouillons (API ?preview=1), sans compter les vues. */
  preview?: boolean
}

/**
 * Découpe le markdown en deux parties : tout ce qui précède le 4e paragraphe
 * (les titres, listes et citations ne comptent pas comme paragraphes) et le
 * reste. Sert à insérer l'espace publicitaire natif au bon endroit, sans
 * mutation pendant le rendu.
 */
function splitMarkdownAtParagraph(content: string, paragraphTarget: number) {
  const blocks = content.split(/\n{2,}/)
  let paragraphs = 0
  let cutIndex = -1
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim()
    if (!block) continue
    const isHeading = /^#{1,6}\s/.test(block)
    const isList = /^([-*+]|\d+\.)\s/m.test(block)
    const isQuote = block.startsWith(">")
    if (!isHeading && !isList && !isQuote) paragraphs += 1
    if (paragraphs >= paragraphTarget) {
      cutIndex = i + 1
      break
    }
  }
  if (cutIndex <= 0 || cutIndex >= blocks.length) {
    return { before: content, after: "" }
  }
  return {
    before: blocks.slice(0, cutIndex).join("\n\n"),
    after: blocks.slice(cutIndex).join("\n\n"),
  }
}

/**
 * Isole le premier paragraphe du corps pour y appliquer la lettrine.
 * Renvoie `lead: null` si le contenu commence par un titre, une liste,
 * une citation, une image ou un tableau — la lettrine ne s'applique alors pas.
 */
function splitLeadParagraph(content: string): { lead: string | null; rest: string } {
  const blocks = content.split(/\n{2,}/)
  const index = blocks.findIndex((block) => block.trim().length > 0)
  if (index === -1) return { lead: null, rest: content }
  const block = blocks[index].trim()
  const isHeading = /^#{1,6}\s/.test(block)
  const isList = /^([-*+]|\d+\.)\s/m.test(block)
  const isQuote = block.startsWith(">")
  const isImage = /^!\[/.test(block)
  const isTable = block.startsWith("|")
  if (isHeading || isList || isQuote || isImage || isTable) {
    return { lead: null, rest: content }
  }
  const rest = [...blocks.slice(0, index), ...blocks.slice(index + 1)]
    .join("\n\n")
    .trim()
  return { lead: block, rest }
}

type MarkdownComponents = NonNullable<
  React.ComponentProps<typeof ReactMarkdown>["components"]
>

/**
 * Composants « prose maison » pour le markdown des articles :
 * colonne de lecture, lettrine, intertitres à filet rouge, citations bleues,
 * listes à puces carrées, liens soulignés de marque.
 */
function createMarkdownComponents({ lead = false } = {}): MarkdownComponents {
  return {
    h2: ({ children }) => (
      <h2 className="mt-12 first:mt-0">
        <span className="headline block text-2xl font-bold tracking-tight text-foreground md:text-[1.75rem]">
          {children}
        </span>
        <span aria-hidden="true" className="mt-2.5 block h-[2px] w-10 bg-brand-red" />
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="headline mt-8 text-lg font-bold tracking-tight md:text-xl">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className={lead ? "drop-cap" : "mt-5 first:mt-0"}>{children}</p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    ul: ({ children }) => (
      <ul className="mt-5 space-y-3 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.72em] [&>li]:before:size-1.5 [&>li]:before:bg-brand-red [&>li]:before:content-[''] [&>li]:relative [&>li]:pl-6">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mt-5 list-decimal space-y-3 pl-6 marker:font-bold marker:text-brand-blue">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="[&>p]:mt-0">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="mt-8 border-l-[3px] border-brand-blue py-1 pl-6 font-serif text-xl font-medium italic leading-[1.45] tracking-tight text-[#0a1e3c] dark:text-zinc-100 md:text-2xl [&>p]:mt-0">
        {children}
      </blockquote>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="link-underline font-semibold text-brand-blue transition-colors hover:text-[#134aaf] dark:hover:text-[#8fb4f2]"
      >
        {children}
      </a>
    ),
    img: ({ src, alt }) => (
      <span className="my-8 block border border-border bg-muted">
        <img
          src={typeof src === "string" ? src : undefined}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          className="block max-h-[560px] w-full object-cover"
        />
        {alt ? (
          <span className="block px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400">
            {alt}
          </span>
        ) : null}
      </span>
    ),
    hr: () => <hr className="mt-10 border-border" />,
  }
}

const BODY_COMPONENTS = createMarkdownComponents()
const LEAD_COMPONENTS = createMarkdownComponents({ lead: true })

/** Corps d'article en markdown : lettrine optionnelle + prose maison. */
function MarkdownBody({
  content,
  dropCap = false,
}: {
  content: string
  dropCap?: boolean
}) {
  const { lead, rest } = React.useMemo(
    () => (dropCap ? splitLeadParagraph(content) : { lead: null, rest: content }),
    [content, dropCap]
  )
  return (
    <div className="text-[17px] leading-[1.85] text-foreground/90">
      {lead ? <ReactMarkdown components={LEAD_COMPONENTS}>{lead}</ReactMarkdown> : null}
      {rest ? <ReactMarkdown components={BODY_COMPONENTS}>{rest}</ReactMarkdown> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                             Mini-carte « liés »                            */
/* -------------------------------------------------------------------------- */

/** Carte compacte des articles liés (construite localement, hors ArticleCard). */
function RelatedCard({
  article,
  onOpen,
}: {
  article: ArticleListItem
  onOpen: (slug: string) => void
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="h-full"
    >
      <button
        type="button"
        onClick={() => onOpen(article.slug)}
        className="group flex h-full w-full flex-col text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="img-zoom block aspect-[16/10] w-full border border-border bg-muted">
          <SmartImage
            src={article.coverImage}
            alt=""
            fallbackColor={article.category.color}
          />
        </span>
        <span
          className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: article.category.color }}
        >
          <span
            aria-hidden="true"
            className="size-2 shrink-0"
            style={{ backgroundColor: article.category.color }}
          />
          {article.category.name}
        </span>
        <span className="headline mt-2 block text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-brand-blue group-focus-visible:text-brand-blue md:text-xl">
          {article.title}
        </span>
        <span className="mt-2 line-clamp-2 block text-[13px] leading-relaxed text-muted-foreground">
          {article.excerpt}
        </span>
        <span className="mt-auto pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {formatDateShort(article.publishedAt)} · {article.readMinutes} min
        </span>
      </button>
    </motion.article>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Squelette chargement                          */
/* -------------------------------------------------------------------------- */

function ArticleSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hairline-b">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="band-paper border-b border-zinc-200">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-12">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-5 h-12 w-full" />
          <Skeleton className="mt-3 h-12 w-3/4" />
          <Skeleton className="mt-6 h-5 w-2/3" />
          <div className="mt-8 flex items-center gap-4">
            <Skeleton className="size-11" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="mt-6 h-1 w-16" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <Skeleton className="aspect-video w-full" />
      </div>
      <div className="mx-auto max-w-[720px] px-4 pt-10 sm:px-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 ArticleView                                */
/* -------------------------------------------------------------------------- */

/** Vue « lecture d'article » : expérience de lecture signature de la marque. */
export function ArticleView({ slug, navigate, preview = false }: ArticleViewProps) {
  const { data, error, loading, retry, status } = useFetch<ArticleResponse>(
    preview
      ? `/api/articles/${encodeURIComponent(slug)}?preview=1`
      : `/api/articles/${encodeURIComponent(slug)}`
  )
  // Compteur de vues : une seule incrémentation par ouverture d'article
  // (désactivée en mode aperçu — les brouillons ne gonflent pas les stats).
  React.useEffect(() => {
    if (!slug || preview) return
    fetch(`/api/articles/${encodeURIComponent(slug)}/view`, { method: "POST" }).catch(
      () => {
        /* silencieux : le compteur n'est pas critique */
      }
    )
  }, [slug])

  const article = data?.article
  // Découpage déterministe du corps pour insérer l'espace publicitaire natif.
  const markdownSplit = React.useMemo(
    () => (article ? splitMarkdownAtParagraph(article.content, 4) : null),
    [article]
  )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/#${slug}`)
      toast({
        title: "Lien copié !",
        description: "Le lien vers cet article est dans votre presse-papiers.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Copie impossible",
        description: "Votre navigateur a refusé l'accès au presse-papiers.",
      })
    }
  }

  const openRelated = React.useCallback(
    (next: string) => navigate({ type: "article", slug: next }),
    [navigate]
  )

  if (loading) return <ArticleSkeleton />

  if (error || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {status === 404 ? (
          <div className="flex flex-col items-center gap-4 border border-dashed p-10 text-center">
            <span className="headline text-6xl font-black text-brand-red">404</span>
            <h1 className="headline text-xl font-bold">Article introuvable</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Cet article n&apos;existe pas ou a été déplacé.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => navigate({ type: "home" })}
                className="bg-foreground font-bold uppercase tracking-[0.13em] text-background hover:bg-foreground/85"
              >
                <Home aria-hidden="true" />
                Retour à l&apos;accueil
              </Button>
              <Button
                variant="outline"
                onClick={retry}
                className="border-foreground font-bold uppercase tracking-[0.13em] hover:bg-foreground hover:text-background"
              >
                <RotateCw aria-hidden="true" />
                Réessayer
              </Button>
            </div>
          </div>
        ) : (
          <ErrorState message={error ?? "Erreur inconnue"} onRetry={retry} />
        )}
      </div>
    )
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  /* Boutons de partage : carrés 44 px bordés, inversion bleu de marque. */
  const shareClass =
    "inline-flex size-11 items-center justify-center border border-border text-muted-foreground transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 hover:border-brand-blue hover:bg-brand-blue hover:text-white"

  return (
    <article className="pb-4">
      {/* ------------------------- Navigation retour ------------------------ */}
      <nav aria-label="Retour aux actualités" className="hairline-b">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate({ type: "home" })}
            className="kicker link-underline inline-flex min-h-11 items-center gap-2 text-zinc-500 outline-none transition-colors hover:text-brand-blue focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Toutes les actualités
          </button>
        </div>
      </nav>

      {/* ------------------------- En-tête papier --------------------------- */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="band-paper border-b border-zinc-200"
      >
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-8 sm:px-6 md:pb-12 md:pt-10">
          {/* Kicker rubrique (retour) + drapeaux éditoriaux */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() =>
                navigate({ type: "category", slug: article.category.slug })
              }
              className="inline-flex min-h-11 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-600 outline-none transition-colors hover:text-brand-blue focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0"
                style={{ backgroundColor: article.category.color }}
              />
              {article.category.name}
            </button>
            {article.featured ? (
              <span className="bg-brand-red px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                À la une
              </span>
            ) : null}
            {preview ? (
              <span className="bg-[#0a1e3c] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                Brouillon — aperçu
              </span>
            ) : null}
          </div>

          <h1 className="headline mt-5 text-4xl font-black leading-[1.05] text-zinc-950 md:text-[3.4rem]">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="mt-5 font-serif text-lg italic leading-relaxed text-zinc-600 md:text-xl md:leading-relaxed">
              {article.excerpt}
            </p>
          ) : null}

          {/* Byline */}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center bg-brand-blue text-sm font-bold text-white"
            >
              {article.author.initials}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-950">
                {article.author.name}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                {article.author.role}
              </p>
            </div>
            <span aria-hidden="true" className="hidden h-8 w-px bg-zinc-300 sm:block" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden="true" />
                {article.readMinutes} min de lecture
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-4" aria-hidden="true" />
                {formatViews(article.views)} lectures
              </span>
            </div>
          </div>
          <div aria-hidden="true" className="rule-brand mt-6 h-1 w-16" />

          {/* Reportage vidéo en tête (16/9, cadre plein) */}
          {article.videoUrl ? (
            <figure className="mt-8">
              <video
                src={article.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full border-2 border-zinc-950 bg-black"
              />
              <figcaption className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Reportage vidéo
              </figcaption>
            </figure>
          ) : null}
        </div>
      </motion.header>

      {/* ------------------------ Image principale -------------------------- */}
      {article.coverImage ? (
        <figure className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 md:pt-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="img-zoom aspect-video w-full border border-zinc-200 bg-muted"
          >
            <SmartImage
              src={article.coverImage}
              alt={`Illustration : ${article.title}`}
              fallbackColor={article.category.color}
              eager
            />
          </motion.div>
          <figcaption className="mt-2 flex items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="truncate">Illustration — {article.category.name}</span>
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.22em]">
              © REFERENCE.COM
            </span>
          </figcaption>
        </figure>
      ) : null}

      {/* ------------------------------- Corps ------------------------------ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mx-auto max-w-[720px] px-4 pt-10 sm:px-6"
      >
        {markdownSplit ? (
          <>
            <MarkdownBody content={markdownSplit.before} dropCap />
            <div className="my-10">
              <AdSlot slot="inline" navigate={navigate} bare />
            </div>
            {markdownSplit.after ? (
              <MarkdownBody content={markdownSplit.after} />
            ) : null}
          </>
        ) : null}

        {/* Tags */}
        {article.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
            <span className="kicker mr-2 text-muted-foreground">Sujets</span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* Partage */}
        <div className="mt-10 border-t border-border pt-6">
          <p className="kicker text-muted-foreground">Partager cet article</p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <a
              href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(shareUrl)}`}
              className={shareClass}
              aria-label="Partager par e-mail"
            >
              <Mail className="size-4" aria-hidden="true" />
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={shareClass}
              aria-label="Partager sur Facebook"
            >
              <Facebook className="size-4" aria-hidden="true" />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={shareClass}
              aria-label="Partager sur LinkedIn"
            >
              <Linkedin className="size-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={copyLink}
              className={shareClass}
              aria-label="Copier le lien de l'article"
            >
              <Link2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div aria-hidden="true" className="rule-brand mt-10 h-1" />
      </motion.div>

      {/* --------------------------- Encart auteur -------------------------- */}
      <section
        aria-label="À propos de l'auteur"
        className="band-paper mt-10 border-y border-zinc-200"
      >
        <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 md:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center bg-brand-blue text-lg font-bold text-white"
            >
              {article.author.initials}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Écrit par
              </p>
              <p className="headline mt-1.5 text-xl font-bold text-zinc-950">
                {article.author.name}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-blue">
                {article.author.role}
              </p>
              {article.author.bio ? (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
                  {article.author.bio}
                </p>
              ) : null}
              <p className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                <span aria-hidden="true" className="size-2 shrink-0 bg-brand-red" />
                Tous ses articles
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- Articles liés --------------------------- */}
      {data && data.related.length > 0 ? (
        <section
          aria-labelledby="related-heading"
          className="mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6"
        >
          <div className="flex items-end justify-between gap-4 border-b-2 border-foreground pb-3">
            <div>
              <p className="kicker flex items-center gap-2 text-brand-red">
                <span aria-hidden="true" className="brand-square bg-brand-red" />
                Poursuivre la lecture
              </p>
              <h2
                id="related-heading"
                className="headline mt-1.5 text-2xl font-bold tracking-tight md:text-[1.75rem]"
              >
                À lire aussi
              </h2>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate({ type: "category", slug: article.category.slug })
              }
              className="kicker link-underline inline-flex min-h-11 shrink-0 items-center gap-1.5 text-brand-blue outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Toute la rubrique
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {data.related.map((related) => (
              <RelatedCard key={related.id} article={related} onOpen={openRelated} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
