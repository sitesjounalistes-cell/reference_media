/**
 * REFERENCE.COM — Cockpit rédaction : helpers partagés des routes /api/admin.
 * Fichier privé (préfixé _) : n'est jamais exposé comme route, uniquement
 * des fonctions et schémas réutilisés par les route handlers voisins.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"

/* ------------------------------- Réponses -------------------------------- */

/** Lit un corps JSON ; sinon fournit une réponse 400 prête à retourner. */
export async function readJsonBody(
  request: Request
): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, data: await request.json() }
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Requête invalide : JSON attendu" },
        { status: 400 }
      ),
    }
  }
}

/** Première erreur de validation zod → réponse 400 avec message français. */
export function invalidBody(error: z.ZodError, fallback: string) {
  return NextResponse.json(
    { error: error.issues[0]?.message ?? fallback },
    { status: 400 }
  )
}

/** Réponse 204 sans contenu (suppressions). */
export function noContent() {
  return new NextResponse(null, { status: 204 })
}

/* --------------------------------- Slugs ---------------------------------- */

/** Normalise un libellé en slug : minuscules, accents retirés, [a-z0-9-]. */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "article"
  )
}

/**
 * Rend un slug unique en suffixant -2, -3, … tant que `isTaken` répond vrai.
 * Utilisé quand le slug est généré automatiquement.
 */
export async function resolveUniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const clean = slugify(base)
  let candidate = clean
  for (let suffix = 2; suffix < 200; suffix++) {
    if (!(await isTaken(candidate))) return candidate
    candidate = `${clean}-${suffix}`
  }
  return `${clean}-${Date.now()}`
}

export async function articleSlugTaken(slug: string): Promise<boolean> {
  return Boolean(
    await db.article.findUnique({ where: { slug }, select: { id: true } })
  )
}

/** Slug pris par un AUTRE article (utilisé en PATCH). */
export async function articleSlugTakenElsewhere(
  slug: string,
  id: string
): Promise<boolean> {
  return Boolean(
    await db.article.findFirst({
      where: { slug, id: { not: id } },
      select: { id: true },
    })
  )
}

export async function categorySlugTaken(slug: string): Promise<boolean> {
  return Boolean(
    await db.category.findUnique({ where: { slug }, select: { id: true } })
  )
}

/** Slug pris par une AUTRE rubrique (utilisé en PATCH). */
export async function categorySlugTakenElsewhere(
  slug: string,
  id: string
): Promise<boolean> {
  return Boolean(
    await db.category.findFirst({
      where: { slug, id: { not: id } },
      select: { id: true },
    })
  )
}

/* -------------------------------- Initiales -------------------------------- */

/** Initiales d'un nom : 1re lettre des 2 premiers mots, majuscules, sans accents. */
export function computeInitials(name: string): string {
  const letters = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
  return letters || "?"
}

/* -------------------------------- Constantes ------------------------------- */

export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

/**
 * URL de média acceptable : chemin interne ("/uploads/…") ou HTTPS externe.
 * Bloque javascript:, data:, http: en clair et les liens protocole-relatifs
 * (« //exemple.com ») qui hériteraient du schéma courant.
 */
export function isSafeAssetUrl(value: string | null | undefined): boolean {
  if (!value) return true
  if (value.startsWith("/") && !value.startsWith("//")) return true
  return /^https:\/\/\S+$/i.test(value)
}

export const ASSET_URL_ERROR =
  "URL invalide : chemin interne (/…) ou https:// uniquement"

/** Emplacements publicitaires disponibles (contrat types.ts). */
export const AD_SLOTS = [
  "top",
  "leaderboard",
  "sidebar",
  "rail-left",
  "rail-right",
  "inline",
  "billboard",
  "bottom",
] as const

export type AdminAdSlot = (typeof AD_SLOTS)[number]

/** 200 Mo en octets (limite d'upload de la médiathèque : sons et vidéos complets). */
export const MAX_UPLOAD_SIZE_MO = 200
export const MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MO * 1024 * 1024

/* ----------------------------- Articles (zod) ------------------------------ */

export const articleStatusSchema = z.enum(["DRAFT", "PUBLISHED", "HIDDEN"], {
  error: "Statut d'article invalide",
})

const readMinutesSchema = z
  .number({ error: "Durée de lecture invalide" })
  .int("La durée de lecture doit être un nombre entier")
  .min(1, "La durée de lecture minimale est de 1 minute")
  .max(60, "La durée de lecture maximale est de 60 minutes")

/**
 * Base article SANS valeur par défaut :
 * - POST → `articleInputSchema` (les défauts s'appliquent aux clés absentes) ;
 * - PATCH → `articlePatchSchema` (tout facultatif, aucune valeur fantôme).
 */
const articleBase = z.object({
  title: z
    .string({ error: "Le titre est requis" })
    .trim()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  slug: z
    .string({ error: "Le slug est requis" })
    .trim()
    .min(1, "Le slug ne peut pas être vide")
    .max(200, "Le slug ne peut pas dépasser 200 caractères")
    .optional(),
  excerpt: z
    .string({ error: "Le chapô est requis" })
    .trim()
    .min(10, "Le chapô doit contenir au moins 10 caractères")
    .max(400, "Le chapô ne peut pas dépasser 400 caractères"),
  content: z
    .string({ error: "Le contenu est requis" })
    .min(30, "Le contenu doit contenir au moins 30 caractères"),
  categoryId: z
    .string({ error: "La rubrique est requise" })
    .min(1, "La rubrique est requise"),
  authorId: z
    .string({ error: "L'auteur est requis" })
    .min(1, "L'auteur est requis"),
  tags: z
    .array(z.string().trim().min(1))
    .max(20, "20 tags maximum")
    .optional(),
  readMinutes: readMinutesSchema,
  featured: z.boolean({ error: "Mis en avant : booléen attendu" }),
  status: articleStatusSchema,
  coverImage: z
    .string()
    .max(500, "URL d'image trop longue")
    .nullable()
    .optional()
    .refine(isSafeAssetUrl, ASSET_URL_ERROR),
  videoUrl: z
    .string()
    .max(500, "URL de vidéo trop longue")
    .nullable()
    .optional()
    .refine(isSafeAssetUrl, ASSET_URL_ERROR),
})

export const articleInputSchema = articleBase.extend({
  readMinutes: readMinutesSchema.default(5),
  featured: z.boolean({ error: "Mis en avant : booléen attendu" }).default(false),
  status: articleStatusSchema.default("DRAFT"),
})

export const articlePatchSchema = articleBase.partial()

/* ---------------------- Canaux, socials, campagnes... ---------------------- */

const channelBase = z.object({
  type: z.enum(["PHONE", "EMAIL", "ADDRESS", "HOURS"], {
    error: "Type de canal invalide",
  }),
  label: z
    .string({ error: "Le libellé est requis" })
    .trim()
    .min(1, "Le libellé est requis")
    .max(60, "Le libellé ne peut pas dépasser 60 caractères"),
  value: z
    .string({ error: "La valeur est requise" })
    .trim()
    .min(1, "La valeur est requise")
    .max(200, "La valeur ne peut pas dépasser 200 caractères"),
  order: z
    .number({ error: "Ordre invalide" })
    .int("L'ordre doit être un nombre entier")
    .optional(),
  visible: z.boolean({ error: "Visible : booléen attendu" }),
})

export const channelInputSchema = channelBase.extend({
  visible: z.boolean({ error: "Visible : booléen attendu" }).default(true),
})

export const channelPatchSchema = channelBase.partial()

export const socialInputSchema = z.object({
  platform: z
    .string({ error: "La plateforme est requise" })
    .trim()
    .min(1, "La plateforme est requise")
    .max(30, "La plateforme ne peut pas dépasser 30 caractères"),
  url: z
    .string({ error: "L'URL est requise" })
    .trim()
    .min(1, "L'URL est requise")
    .max(500, "L'URL ne peut pas dépasser 500 caractères")
    .url("URL invalide")
    // http(s) uniquement — zod .url() accepte aussi javascript: et data:.
    .refine(
      (value) => /^https?:\/\//i.test(value),
      "URL invalide : adresse http(s) requise"
    ),
  order: z
    .number({ error: "Ordre invalide" })
    .int("L'ordre doit être un nombre entier")
    .optional(),
  visible: z.boolean({ error: "Visible : booléen attendu" }).optional(),
})

export const socialPatchSchema = socialInputSchema.partial()

const weightSchema = z
  .number({ error: "Poids invalide" })
  .int("Le poids doit être un nombre entier")
  .min(1, "Le poids minimal est 1")
  .max(10, "Le poids maximal est 10")

export const campaignInputSchema = z.object({
  name: z
    .string({ error: "Le nom de campagne est requis" })
    .trim()
    .min(2, "Le nom de campagne doit contenir au moins 2 caractères")
    .max(120, "Le nom de campagne ne peut pas dépasser 120 caractères"),
  advertiser: z
    .string({ error: "L'annonceur est requis" })
    .trim()
    .min(2, "L'annonceur doit contenir au moins 2 caractères")
    .max(80, "L'annonceur ne peut pas dépasser 80 caractères"),
  headline: z
    .string({ error: "Le titre de la créa est requis" })
    .trim()
    .min(2, "Le titre de la créa doit contenir au moins 2 caractères")
    .max(120, "Le titre de la créa ne peut pas dépasser 120 caractères"),
  body: z
    .string({ error: "Le texte de la créa est requis" })
    .trim()
    .min(2, "Le texte de la créa doit contenir au moins 2 caractères")
    .max(400, "Le texte de la créa ne peut pas dépasser 400 caractères"),
  ctaLabel: z
    .string({ error: "Le libellé du bouton est requis" })
    .trim()
    .min(2, "Le libellé du bouton doit contenir au moins 2 caractères")
    .max(60, "Le libellé du bouton ne peut pas dépasser 60 caractères"),
  ctaView: z
    .string({ error: "La destination du bouton est requise" })
    .trim()
    .min(1, "La destination du bouton est requise")
    .max(120, "La destination du bouton ne peut pas dépasser 120 caractères"),
  color: z
    .string({ error: "La couleur est requise" })
    .regex(HEX_COLOR_REGEX, "Couleur invalide (format #RRGGBB attendu)"),
  imageUrl: z
    .string()
    .trim()
    .max(400, "L'URL du visuel ne peut pas dépasser 400 caractères")
    .optional()
    .refine(isSafeAssetUrl, ASSET_URL_ERROR),
  slots: z
    .array(z.enum(AD_SLOTS, { error: "Emplacement publicitaire invalide" }))
    .min(1, "Sélectionnez au moins un emplacement"),
  active: z.boolean({ error: "Actif : booléen attendu" }).default(true),
  weight: weightSchema.default(1),
})

export const campaignPatchSchema = campaignInputSchema
  .extend({
    active: z.boolean({ error: "Actif : booléen attendu" }).optional(),
    weight: weightSchema.optional(),
  })
  .partial()

export const authorInputSchema = z.object({
  name: z
    .string({ error: "Le nom est requis" })
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(80, "Le nom ne peut pas dépasser 80 caractères"),
  role: z
    .string({ error: "La fonction est requise" })
    .trim()
    .min(2, "La fonction doit contenir au moins 2 caractères")
    .max(60, "La fonction ne peut pas dépasser 60 caractères"),
  bio: z
    .string({ error: "La biographie est requise" })
    .trim()
    .min(10, "La biographie doit contenir au moins 10 caractères")
    .max(600, "La biographie ne peut pas dépasser 600 caractères"),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "Couleur invalide (format #RRGGBB attendu)")
    .optional(),
})

export const authorPatchSchema = authorInputSchema.partial().extend({
  initials: z
    .string({ error: "Les initiales sont requises" })
    .trim()
    .min(1, "Les initiales ne peuvent pas être vides")
    .max(4, "Les initiales ne peuvent pas dépasser 4 caractères")
    .optional(),
})

export const categoryInputSchema = z.object({
  name: z
    .string({ error: "Le nom est requis" })
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(60, "Le nom ne peut pas dépasser 60 caractères"),
  slug: z
    .string({ error: "Le slug est requis" })
    .trim()
    .min(1, "Le slug ne peut pas être vide")
    .max(80, "Le slug ne peut pas dépasser 80 caractères")
    .optional(),
  description: z
    .string({ error: "La description est requise" })
    .trim()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(300, "La description ne peut pas dépasser 300 caractères"),
  color: z
    .string({ error: "La couleur est requise" })
    .regex(HEX_COLOR_REGEX, "Couleur invalide (format #RRGGBB attendu)"),
  icon: z
    .string({ error: "L'icône est requise" })
    .trim()
    .min(1, "L'icône est requise")
    .max(40, "L'icône ne peut pas dépasser 40 caractères"),
  image: z
    .string()
    .max(500, "URL d'image trop longue")
    .nullable()
    .optional()
    .refine(isSafeAssetUrl, ASSET_URL_ERROR),
  order: z
    .number({ error: "Ordre invalide" })
    .int("L'ordre doit être un nombre entier")
    .optional(),
})

export const categoryPatchSchema = categoryInputSchema.partial()

/* --------------------------------- Mappers --------------------------------- */

export interface AdminArticleRow {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string | null
  videoUrl: string | null
  status: string
  featured: boolean
  views: number
  readMinutes: number
  tags: string
  categoryId: string
  authorId: string
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
  category: { name: string }
  author: { name: string }
}

/** Article brut → AdminArticleDto (contrat types.ts, dates ISO). */
export function mapAdminArticle(row: AdminArticleRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.coverImage,
    videoUrl: row.videoUrl,
    status: row.status,
    featured: row.featured,
    views: row.views,
    readMinutes: row.readMinutes,
    tags: row.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    categoryId: row.categoryId,
    categoryName: row.category.name,
    authorId: row.authorId,
    authorName: row.author.name,
    publishedAt: row.publishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapAdminMessage(row: {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: Date
}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapAdminAuthor(row: {
  id: string
  name: string
  role: string
  bio: string
  initials: string
  color: string
  _count: { articles: number }
}) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    bio: row.bio,
    initials: row.initials,
    color: row.color,
    articleCount: row._count.articles,
  }
}

export function mapAdminCategory(row: {
  id: string
  slug: string
  name: string
  description: string
  color: string
  icon: string
  image: string | null
  order: number
  _count: { articles: number }
}) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    image: row.image,
    order: row.order,
    articleCount: row._count.articles,
  }
}

/* -------------------------------- Campagnes -------------------------------- */

export interface AdStats {
  impressions: number
  clicks: number
}

/** Statistiques d'événements par campagne (un seul groupBy). */
export async function fetchAdStats(): Promise<Map<string, AdStats>> {
  const rows = await db.adEvent.groupBy({
    by: ["campaignId", "type"],
    _count: { _all: true },
  })

  const stats = new Map<string, AdStats>()
  for (const row of rows) {
    if (row.type !== "impression" && row.type !== "click") continue
    const entry = stats.get(row.campaignId) ?? { impressions: 0, clicks: 0 }
    if (row.type === "click") entry.clicks += row._count._all
    else entry.impressions += row._count._all
    stats.set(row.campaignId, entry)
  }
  return stats
}

/** Campagne brute + stats → AdminCampaignDto (ctr en pourcentage). */
export function mapCampaign(
  row: {
    id: string
    name: string
    advertiser: string
    headline: string
    body: string
    ctaLabel: string
    ctaView: string
    color: string
    imageUrl?: string | null
    slots: string
    active: boolean
    weight: number
    createdAt: Date
  },
  stats: AdStats | undefined
) {
  const impressions = stats?.impressions ?? 0
  const clicks = stats?.clicks ?? 0
  return {
    id: row.id,
    name: row.name,
    advertiser: row.advertiser,
    headline: row.headline,
    body: row.body,
    ctaLabel: row.ctaLabel,
    ctaView: row.ctaView,
    color: row.color,
    imageUrl: row.imageUrl ?? null,
    slots: row.slots
      .split(",")
      .map((slot) => slot.trim())
      .filter(Boolean) as AdminAdSlot[],
    active: row.active,
    weight: row.weight,
    impressions,
    clicks,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
    createdAt: row.createdAt.toISOString(),
  }
}
