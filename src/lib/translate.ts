/**
 * REFERENCE.COM — Traduction serveur des contenus éditoriaux (FR → cible).
 *
 * Stratégie :
 * - point d'accès public de Google Translate (client gtx, sans clé) ;
 * - cache persistant en base (table ArticleTranslation) : la première lecture
 *   d'un article dans une langue paie la traduction, les suivantes servent
 *   la version en cache — y compris pour les listes (titre + chapô seuls) ;
 * - textes longs découpés par paragraphes (limite d'URL du point d'accès) ;
 * - petite concurrence (3) pour rester courtois ;
 * - en cas d'échec : retour du français source — jamais de page cassée.
 */
import { db } from "@/lib/db"
import type { Lang } from "@/lib/i18n"

const ENDPOINT = "https://translate.googleapis.com/translate_a/single"
/** Limite prudente par requête (le paramètre voyage dans l'URL). */
const MAX_CHUNK = 3500
/** Concurrence maximale vers le service de traduction. */
const CONCURRENCY = 3

/** Exécute les tâches avec au plus `CONCURRENCY` requêtes simultanées. */
async function pooled<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
  const results = new Array<T>(tasks.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const index = cursor++
      results[index] = await tasks[index]()
    }
  })
  await Promise.all(workers)
  return results
}

/** Traduit un texte simple (une chaîne, pas de markdown). */
export async function translateText(
  text: string,
  target: Lang,
  source = "fr"
): Promise<string> {
  if (!text.trim() || target === source) return text
  const url =
    `${ENDPOINT}?client=gtx&sl=${source}&tl=${target}&dt=t&q=` +
    encodeURIComponent(text)
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) throw new Error(`translate HTTP ${response.status}`)
  const data = (await response.json()) as unknown
  // Format gtx : [[["traduit","source",…],…], …] — on concatène les segments.
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("réponse de traduction inattendue")
  }
  const segments = (data[0] as unknown[])
    .map((segment) => (Array.isArray(segment) ? String(segment[0] ?? "") : ""))
    .join("")
  return segments || text
}

/** Découpe un texte en morceaux ≤ MAX_CHUNK sans couper un paragraphe. */
function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text]
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let current = ""
  for (const paragraph of paragraphs) {
    // Paragraphe seul trop long : coupure sur les sauts de ligne simples.
    const pieces =
      paragraph.length > MAX_CHUNK ? paragraph.split(/\n(?!\n)/) : [paragraph]
    for (const piece of pieces) {
      if ((current + "\n\n" + piece).trim().length > MAX_CHUNK && current) {
        chunks.push(current)
        current = piece
      } else {
        current = current ? `${current}\n\n${piece}` : piece
      }
    }
  }
  if (current) chunks.push(current)
  return chunks
}

/** Traduit un texte long en respectant la structure de paragraphes. */
async function translateLongText(
  text: string,
  target: Lang
): Promise<string> {
  const chunks = chunkText(text)
  const translated = await pooled(
    chunks.map((chunk) => () => translateText(chunk, target))
  )
  return translated.join("\n\n")
}

/* -------------------------------- Articles -------------------------------- */

export interface ArticleSource {
  id: string
  title: string
  excerpt: string
  content: string
  updatedAt: Date
}

export interface TranslatedFields {
  title: string
  excerpt: string
  /** Vide si seule la traduction des métadonnées a été demandée. */
  content: string
  /** Vrai si le contenu complet est disponible dans la langue demandée. */
  hasContent: boolean
}

/**
 * Traduction d'un article avec cache :
 * - `includeContent: false` (listes) → titre + chapô uniquement ;
 * - `includeContent: true` (lecture) → traduction complète du markdown.
 * La ligne de cache est enrichie progressivement (titre/chapô d'abord,
 * contenu à la première lecture complète).
 */
export async function translateArticle(
  article: ArticleSource,
  lang: Lang,
  includeContent: boolean
): Promise<TranslatedFields> {
  try {
    const cached = await db.articleTranslation.findUnique({
      where: { articleId_lang: { articleId: article.id, lang } },
    })

    // Cache obsolète (article modifié depuis) → on retraduit tout.
    const stale = cached ? cached.updatedAt < article.updatedAt : false
    const needMeta = !cached || stale
    const needContent =
      includeContent && (!cached || stale || cached.content.trim() === "")

    if (!needMeta && !needContent && cached) {
      return {
        title: cached.title,
        excerpt: cached.excerpt,
        content: includeContent ? cached.content : "",
        hasContent: cached.content.trim() !== "",
      }
    }

    const [title, excerpt, content] = await Promise.all([
      needMeta ? translateText(article.title, lang) : Promise.resolve(cached!.title),
      needMeta ? translateText(article.excerpt, lang) : Promise.resolve(cached!.excerpt),
      needContent
        ? translateLongText(article.content, lang)
        : Promise.resolve(cached && !stale ? cached.content : ""),
    ])

    const saved = await db.articleTranslation.upsert({
      where: { articleId_lang: { articleId: article.id, lang } },
      create: { articleId: article.id, lang, title, excerpt, content },
      update: { title, excerpt, ...(needContent ? { content } : {}) },
    })

    return {
      title: saved.title,
      excerpt: saved.excerpt,
      content: includeContent ? saved.content : "",
      hasContent: saved.content.trim() !== "",
    }
  } catch (error) {
    // Indisponibilité du service : le contenu français reste servi.
    console.error(`[translate] article ${article.id} → ${lang}`, error)
    return {
      title: article.title,
      excerpt: article.excerpt,
      content: includeContent ? article.content : "",
      hasContent: false,
    }
  }
}

/* ------------------------------- Petits textes ----------------------------- */

/**
 * Traduit une liste d'articles avec la concurrence globale du module
 * (les listes ne traduisent que titre + chapô ; la lecture complète
 * enrichit le cache à la demande).
 */
export async function translateMany(
  articles: ArticleSource[],
  lang: Lang,
  includeContent: boolean
): Promise<Map<string, TranslatedFields>> {
  const results = new Map<string, TranslatedFields>()
  await pooled(
    articles.map(
      (article) => async () => {
        results.set(article.id, await translateArticle(article, lang, includeContent))
      }
    )
  )
  return results
}

const memoryCache = new Map<string, { value: string; expiresAt: number }>()
const MEMORY_TTL = 60 * 60 * 1000

/**
 * Traduit une courte liste de libellés (noms de rubriques, sujets…) avec
 * cache mémoire d'une heure. Retourne les valeurs sources en cas d'échec.
 */
export async function translateLabels(
  labels: string[],
  lang: Lang
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (lang === "fr") {
    for (const label of labels) result.set(label, label)
    return result
  }

  const now = Date.now()
  const missing: string[] = []
  for (const label of labels) {
    const cached = memoryCache.get(`${lang}:${label}`)
    if (cached && cached.expiresAt > now) result.set(label, cached.value)
    else if (!result.has(label)) missing.push(label)
  }

  if (missing.length > 0) {
    try {
      const translated = await pooled(
        missing.map((label) => () => translateText(label, lang))
      )
      missing.forEach((label, index) => {
        const value = translated[index] ?? label
        memoryCache.set(`${lang}:${label}`, { value, expiresAt: now + MEMORY_TTL })
        result.set(label, value)
      })
    } catch (error) {
      console.error(`[translate] libellés → ${lang}`, error)
      for (const label of missing) result.set(label, label)
    }
  }

  return result
}
