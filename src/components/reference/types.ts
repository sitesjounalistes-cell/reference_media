/** Contrat d'API REFERENCE.COM — typage partagé du frontend. */

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  /** hex, ex. "#1B5FD9" */
  color: string
  /** nom d'icône lucide, ex. "FlaskConical" */
  icon: string
  image: string | null
  articleCount: number
}

export interface ArticleAuthor {
  name: string
  role: string
  initials: string
  color: string
  /** présent uniquement dans ArticleFull */
  bio?: string
}

export interface ArticleCategoryRef {
  slug: string
  name: string
  color: string
}

/* -------------------- Typographie éditoriale (titre/chapô/contenu) -------- */

/** Police proposée à la rédaction (variables CSS du thème). */
export type ArticleFont = "serif" | "sans" | "archivo" | "mono"

/** Style d'un champ : police + gras + italique (tous optionnels). */
export interface ArticleTextStyle {
  font?: ArticleFont
  bold?: boolean
  italic?: boolean
}

/** Typographie d'un article, définie dans le cockpit. */
export interface ArticleTypography {
  title?: ArticleTextStyle
  excerpt?: ArticleTextStyle
  content?: ArticleTextStyle
}


export interface ArticleListItem {
  id: string
  slug: string
  title: string
  excerpt: string
  coverImage: string | null
  tags: string[]
  readMinutes: number
  views: number
  featured: boolean
  /** date ISO */
  publishedAt: string
  category: ArticleCategoryRef
  author: ArticleAuthor
}

export interface ArticleFull extends ArticleListItem {
  /** markdown */
  content: string
  /** reportage vidéo attaché (URL ou /uploads/...), optionnel */
  videoUrl?: string | null
  /** typographie éditoriale (police/gras/italique par champ), optionnelle */
  typography?: ArticleTypography | null
  /** date ISO */
  updatedAt: string
}

export interface ArticlesResponse {
  articles: ArticleListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ArticleResponse {
  article: ArticleFull
  related: ArticleListItem[]
}

export interface FunFact {
  id: string
  content: string
  source: string | null
}

export interface FactResponse {
  fact: FunFact
}

export interface CategoriesResponse {
  categories: Category[]
}

export interface ViewCountResponse {
  views: number
}

export interface NewsletterResponse {
  ok: boolean
  message: string
}

export interface ApiError {
  error: string
}

export type SortKey = "recent" | "popular"

/* -------------------------------- Publicité ------------------------------- */

/** Emplacements publicitaires disponibles sur le site. */
export type AdSlotName =
  | "top" // bannière au-dessus de l'en-tête, sur tout le site
  | "leaderboard"
  | "sidebar"
  | "rail-left" // gratte-ciel latéral gauche (grand écran)
  | "rail-right" // gratte-ciel latéral droit (grand écran)
  | "inline"
  | "billboard"
  | "bottom" // pavé avant le pied de page, sur tout le site

/** Campagne affichable dans un emplacement (créa maison). */
export interface AdCampaignDto {
  id: string
  name: string
  advertiser: string
  headline: string
  body: string
  ctaLabel: string
  /** "home" | "about" | "contact:publicite" | "category:<slug>" */
  ctaView: string
  /** hex de marque */
  color: string
  /** visuel de la créa (display ad) — absent → créa texte */
  imageUrl?: string | null
  /** emplacements compatibles, ex. ["leaderboard", "sidebar"] */
  slots: AdSlotName[]
}

export interface AdsResponse {
  campaigns: AdCampaignDto[]
}

export interface AdTrackPayload {
  campaignId: string
  slot: AdSlotName
  type: "impression" | "click"
}

/* ------------------------------ Tableau de bord ---------------------------- */

export interface DashboardKpis {
  articles: number
  categories: number
  authors: number
  totalViews: number
  subscribers: number
  messages: number
  adImpressions: number
  adClicks: number
  /** taux de clic publicitaire, en pourcentage */
  adCtr: number
  avgReadMinutes: number
}

export interface DashboardTrafficPoint {
  /** date ISO (AAA-MM-JJ) */
  date: string
  /** libellé court fr, ex. « 12 janv. » */
  label: string
  /** lectures estimées sur la journée */
  views: number
}

export interface DashboardAdPoint {
  date: string
  label: string
  impressions: number
  clicks: number
}

export interface DashboardCategoryStat {
  slug: string
  name: string
  color: string
  articles: number
  views: number
  /** part des lectures, en pourcentage */
  share: number
}

export interface DashboardTopArticle {
  slug: string
  title: string
  views: number
  readMinutes: number
  publishedAt: string
  category: { name: string; color: string }
  author: { name: string }
}

export interface DashboardCampaignStat {
  id: string
  name: string
  advertiser: string
  headline: string
  color: string
  slots: string[]
  active: boolean
  impressions: number
  clicks: number
  /** taux de clic, en pourcentage */
  ctr: number
}

/** Route /api/dashboard PUBLIQUE : volontairement anonymisée (aucun email). */
export interface DashboardRecentSubscriber {
  createdAt: string
}

/** Route /api/dashboard PUBLIQUE : sujet et date seulement (ni nom ni email). */
export interface DashboardRecentMessage {
  subject: string
  createdAt: string
}

export interface DashboardResponse {
  kpis: DashboardKpis
  traffic: DashboardTrafficPoint[]
  adSeries: DashboardAdPoint[]
  categories: DashboardCategoryStat[]
  topArticles: DashboardTopArticle[]
  campaigns: DashboardCampaignStat[]
  subscribers: DashboardRecentSubscriber[]
  messages: DashboardRecentMessage[]
  generatedAt: string
}

/** Machine à états de navigation (routeur côté client — seule route : /). */
export type View =
  | { type: "home" }
  | { type: "category"; slug: string }
  | { type: "article"; slug: string; preview?: boolean }
  | { type: "search"; q: string }
  | { type: "about" }
  | { type: "dashboard" }
  | { type: "contact"; subject?: string }
  | { type: "cockpit"; section?: CockpitSection }

export type Navigate = (view: View) => void

export function viewKey(view: View): string {
  switch (view.type) {
    case "category":
      return `category:${view.slug}`
    case "article":
      return `article:${view.slug}`
    case "search":
      return `search:${view.q}`
    case "contact":
      return view.subject ? `contact:${view.subject}` : "contact"
    case "cockpit":
      return `cockpit:${view.section ?? "dashboard"}`
    default:
      return view.type
  }
}

/* -------------------------------- Cockpit --------------------------------- */

/** Sections de l'espace rédaction (cockpit). */
export type CockpitSection =
  | "dashboard"
  | "articles"
  | "editor"
  | "media"
  | "categories"
  | "campaigns"
  | "broadcasts"
  | "messages"
  | "settings"

export const COCKPIT_SECTIONS: CockpitSection[] = [
  "dashboard",
  "articles",
  "editor",
  "media",
  "categories",
  "campaigns",
  "broadcasts",
  "messages",
  "settings",
]

/** Cycle de vie éditorial d'un article. */
export type ArticleStatus = "DRAFT" | "PUBLISHED" | "HIDDEN"

export const ARTICLE_STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  HIDDEN: "Masqué",
}

/** Article tel que vu dans le cockpit (tous statuts). */
export interface AdminArticleDto {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string | null
  videoUrl: string | null
  status: ArticleStatus
  featured: boolean
  views: number
  readMinutes: number
  tags: string[]
  categoryId: string
  categoryName: string
  authorId: string
  authorName: string
  publishedAt: string
  createdAt: string
  updatedAt: string
  /** typographie éditoriale (null = valeurs par défaut du thème) */
  typography: ArticleTypography | null
}

/** Charge utile de création / mise à jour d'un article. */
export interface AdminArticleInput {
  title: string
  slug?: string
  excerpt: string
  content: string
  categoryId: string
  authorId: string
  tags?: string[]
  readMinutes?: number
  featured?: boolean
  status?: ArticleStatus
  coverImage?: string | null
  videoUrl?: string | null
  /** null = effacer les styles personnalisés */
  typography?: ArticleTypography | null
}

export interface AdminArticlesResponse {
  articles: AdminArticleDto[]
  total: number
}

/** Fichier de la médiathèque (images, vidéos, sons, documents). */
export interface MediaAssetDto {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  kind: "IMAGE" | "VIDEO" | "AUDIO" | "DOC"
  /** URL publique, ex. /uploads/xyz.jpg */
  url: string
  createdAt: string
}

export interface MediaListResponse {
  media: MediaAssetDto[]
}

/** Canal de contact (annuaire de la rédaction). */
export interface ContactChannelDto {
  id: string
  type: "PHONE" | "EMAIL" | "ADDRESS" | "HOURS"
  label: string
  value: string
  order: number
  visible: boolean
}

/** Réseau social du site. */
export interface SocialLinkDto {
  id: string
  platform: string
  url: string
  order: number
  visible: boolean
}

/** Réponse publique : tout ce que le site affiche et que le cockpit modifie. */
export interface SiteSettingsResponse {
  settings: Record<string, string>
  channels: ContactChannelDto[]
  socials: SocialLinkDto[]
}

/** Vue d'ensemble du cockpit (compteurs temps réel). */
export interface CockpitOverview {
  articles: { total: number; published: number; draft: number; hidden: number }
  totalViews: number
  media: { count: number; totalSize: number }
  messages: { total: number; unread: number }
  subscribers: number
  campaigns: { total: number; active: number }
  categories: number
  authors: number
}

export interface CockpitOverviewResponse {
  overview: CockpitOverview
  recentMessages: AdminMessageDto[]
  generatedAt: string
}

/** Campagne publicitaire côté cockpit (avec statistiques). */
export interface AdminCampaignDto {
  id: string
  name: string
  advertiser: string
  headline: string
  body: string
  ctaLabel: string
  ctaView: string
  color: string
  imageUrl?: string | null
  slots: AdSlotName[]
  active: boolean
  weight: number
  impressions: number
  clicks: number
  /** pourcentage */
  ctr: number
  createdAt: string
}

export interface AdminCampaignsResponse {
  campaigns: AdminCampaignDto[]
}

export interface AdminCampaignInput {
  name: string
  advertiser: string
  headline: string
  body: string
  ctaLabel: string
  ctaView: string
  color: string
  imageUrl?: string | null
  slots: AdSlotName[]
  active?: boolean
  weight?: number
}

/** Message de contact côté cockpit. */
export interface AdminMessageDto {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: string
}

export interface AdminMessagesResponse {
  messages: AdminMessageDto[]
}

/** Auteur tel que géré dans le cockpit. */
export interface AdminAuthorDto {
  id: string
  name: string
  role: string
  bio: string
  initials: string
  color: string
  articleCount: number
}

export interface AdminCategoryDto {
  id: string
  slug: string
  name: string
  description: string
  color: string
  icon: string
  image: string | null
  order: number
  articleCount: number
}

export interface AdminAuthorsResponse {
  authors: AdminAuthorDto[]
}

export interface AdminCategoriesResponse {
  categories: AdminCategoryDto[]
}

export interface AdminAuthorInput {
  name: string
  role: string
  bio: string
  color?: string
}

export interface AdminCategoryInput {
  name: string
  slug?: string
  description: string
  color: string
  icon: string
  image?: string | null
  order?: number
}
