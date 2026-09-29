"use client"

import * as React from "react"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Megaphone } from "lucide-react"

import { cn } from "@/lib/utils"
import { fetchJson } from "@/components/reference/lib"
import { SmartImage } from "@/components/reference/SmartImage"
import type {
  AdCampaignDto,
  AdSlotName,
  Navigate,
  View,
} from "@/components/reference/types"

/* -------------------------------------------------------------------------- */
/*               Store partagé : une seule requête pour tous les slots        */
/* -------------------------------------------------------------------------- */

let adsCache: AdCampaignDto[] | null = null
let adsInflight: Promise<AdCampaignDto[]> | null = null

function loadAds(): Promise<AdCampaignDto[]> {
  if (adsCache) return Promise.resolve(adsCache)
  if (!adsInflight) {
    adsInflight = fetchJson<{ campaigns: AdCampaignDto[] }>("/api/ads")
      .then((data) => {
        adsCache = data.campaigns
        return adsCache
      })
      .catch((error: unknown) => {
        adsInflight = null
        throw error
      })
  }
  return adsInflight
}

/** Hook partagé : charge les campagnes une seule fois par session de page. */
function useAds(): { campaigns: AdCampaignDto[]; loading: boolean } {
  const [campaigns, setCampaigns] = React.useState<AdCampaignDto[]>(adsCache ?? [])
  const [loading, setLoading] = React.useState(!adsCache)

  React.useEffect(() => {
    if (adsCache) {
      setCampaigns(adsCache)
      setLoading(false)
      return
    }
    let active = true
    loadAds()
      .then((result) => {
        if (!active) return
        setCampaigns(result)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { campaigns, loading }
}

/* -------------------------------------------------------------------------- */
/*                          Tracking impression / clic                        */
/* -------------------------------------------------------------------------- */

async function trackEvent(payload: {
  campaignId: string
  slot: AdSlotName
  type: "impression" | "click"
}): Promise<void> {
  try {
    await fetch("/api/ads/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    /* silencieux : le tracking n'est pas critique */
  }
}

/* -------------------------------------------------------------------------- */
/*                             Helpers de créa                                */
/* -------------------------------------------------------------------------- */

/** Créa « auto-promotion » affichée quand l'inventaire est disponible. */
const SELF_SERVE: AdCampaignDto = {
  id: "__self_serve__",
  name: "Inventaire disponible",
  advertiser: "Régie REFERENCE.COM",
  headline: "Votre marque ici",
  body: "Cet emplacement est disponible. Diffusez votre message auprès de 120 000 lecteurs curieux, exigeants et fidèles.",
  ctaLabel: "Réserver cet emplacement",
  ctaView: "contact:publicite",
  color: "#E8192C",
  slots: [],
}

function parseCtaView(ctaView: string): View {
  if (ctaView.startsWith("category:")) {
    return { type: "category", slug: ctaView.slice("category:".length) }
  }
  if (ctaView.startsWith("contact")) {
    const [, subject] = ctaView.split(":")
    return { type: "contact", subject: subject || undefined }
  }
  if (ctaView === "about") return { type: "about" }
  if (ctaView === "dashboard") return { type: "dashboard" }
  return { type: "home" }
}

function initialsOf(text: string): string {
  return text
    .split(/\s+/)
    .filter((word) => /[a-zA-ZÀ-ÿ]/.test(word.charAt(0)))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
}

/** Hash déterministe léger — permet un ordre de départ propre à chaque slot. */
function slotSeed(slot: AdSlotName): number {
  let h = 7
  for (let i = 0; i < slot.length; i++) h = (h * 31 + slot.charCodeAt(i)) % 997
  return h
}

/* -------------------------------------------------------------------------- */
/*                        Créas image (display premium)                       */
/* -------------------------------------------------------------------------- */

/**
 * Bloc « logo » annonceur : carré de marque + nom en capitales Archivo.
 * Imite la signature de marque d'un vrai display ad.
 */
function BrandWordmark({
  campaign,
  light = false,
  size = "md",
}: {
  campaign: AdCampaignDto
  light?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const square = size === "lg" ? "size-3" : size === "sm" ? "size-2" : "size-2.5"
  const text =
    size === "lg"
      ? "text-[13px] md:text-sm tracking-[0.18em]"
      : size === "sm"
        ? "text-[9.5px] tracking-[0.16em]"
        : "text-[11px] tracking-[0.16em]"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display font-black uppercase italic leading-none",
        text,
        light ? "text-white" : "text-foreground"
      )}
    >
      <span aria-hidden="true" className={cn(square, "shrink-0")} style={{ backgroundColor: campaign.color }} />
      {campaign.advertiser}
    </span>
  )
}

/** Mention « Annonce » discrète posée sur le visuel — standard display. */
function AdChip() {
  return (
    <span
      aria-hidden="true"
      className="absolute right-2 top-2 z-10 bg-black/55 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-[2px]"
    >
      Annonce
    </span>
  )
}

/**
 * Bouton d'action d'une créa image. Le conteneur entier est cliquable
 * (comme un vrai display ad) : le CTA est donc un libellé, pas un bouton.
 */
function AdCta({
  label,
  color,
  size = "md",
  block = false,
}: {
  label: string
  color: string
  size?: "sm" | "md" | "lg"
  block?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.13em] text-white transition-all duration-200 group-hover:brightness-110",
        size === "sm"
          ? "h-8 px-3.5 text-[10px]"
          : size === "lg"
            ? "h-11 px-6 text-xs"
            : "h-9 px-4 text-[11px]",
        block && "h-auto min-h-8 w-full px-2.5 py-1.5 leading-tight",
        "group-focus-visible:ring-[3px] group-focus-visible:ring-ring/60"
      )}
      style={{ backgroundColor: color }}
    >
      {label}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </span>
  )
}

/**
 * Habillage commun d'une créa image : le panneau entier se comporte comme
 * un lien publicitaire (clic, clavier, aria-label, focus visible).
 */
function ClickableAd({
  campaign,
  onClick,
  className,
  ariaHint,
  children,
}: {
  campaign: AdCampaignDto
  onClick: () => void
  className?: string
  ariaHint?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={ariaHint ?? `Publicité ${campaign.advertiser} : ${campaign.headline}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
    >
      {children}
    </div>
  )
}

/** Bannière « top » : bande compacte photo + accroche, visible sans repousser l'éditorial. */
function TopImageCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <ClickableAd campaign={campaign} onClick={onClick} className="flex h-16 md:h-[72px]">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-2">
        <BrandWordmark campaign={campaign} size="sm" />
        <p className="truncate font-serif text-[15px] font-bold leading-tight tracking-tight md:text-base">
          {campaign.headline}
        </p>
      </div>
      <div className="relative hidden w-64 shrink-0 sm:block">
        <SmartImage
          src={campaign.imageUrl}
          alt=""
          fallbackColor={campaign.color}
          wrapperClassName="h-full w-full"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
    </ClickableAd>
  )
}

/** Leaderboard : classique « photo à droite », texte et CTA à gauche. */
function LeaderboardImageCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <ClickableAd campaign={campaign} onClick={onClick} className="flex min-h-[132px] flex-col sm:flex-row">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-5 md:px-6">
        <BrandWordmark campaign={campaign} />
        <p className="font-serif text-lg font-bold leading-tight tracking-tight md:text-xl">
          {campaign.headline}
        </p>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {campaign.body}
        </p>
        <span className="mt-2 hidden sm:inline-flex">
          <AdCta label={campaign.ctaLabel} color={campaign.color} size="sm" />
        </span>
      </div>
      <div className="relative h-28 w-full shrink-0 sm:h-auto sm:w-[34%] md:w-[38%]">
        <AdChip />
        <SmartImage
          src={campaign.imageUrl}
          alt=""
          fallbackColor={campaign.color}
          wrapperClassName="h-full w-full"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
    </ClickableAd>
  )
}

/** Pavé latéral (MPU 300×250) : visuel au-dessus, bloc de marque en dessous. */
function SidebarImageCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <ClickableAd campaign={campaign} onClick={onClick} className="flex flex-col">
      <div className="relative h-40 shrink-0 md:h-44">
        <AdChip />
        <SmartImage
          src={campaign.imageUrl}
          alt=""
          fallbackColor={campaign.color}
          wrapperClassName="h-full w-full"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5 text-left">
        <BrandWordmark campaign={campaign} size="sm" />
        <p className="font-serif text-[17px] font-bold leading-snug tracking-tight">
          {campaign.headline}
        </p>
        <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
          {campaign.body}
        </p>
        <span className="mt-auto inline-flex pt-3">
          <AdCta label={campaign.ctaLabel} color={campaign.color} size="sm" />
        </span>
      </div>
    </ClickableAd>
  )
}

/** Gratte-ciel (160×600 / half-page) : visuel pleine hauteur, bloc en surimpression bas. */
function RailImageCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <ClickableAd
      campaign={campaign}
      onClick={onClick}
      className="flex min-h-[540px] flex-col justify-end"
    >
      <AdChip />
      <SmartImage
        src={campaign.imageUrl}
        alt=""
        fallbackColor={campaign.color}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#071630]/95 via-[#071630]/55 to-transparent"
      />
      <div className="relative flex flex-col gap-2.5 p-5">
        <BrandWordmark campaign={campaign} light size="sm" />
        <p className="font-serif text-lg font-bold leading-snug tracking-tight text-white">
          {campaign.headline}
        </p>
        <p className="line-clamp-3 text-[12.5px] leading-relaxed text-white/80">
          {campaign.body}
        </p>
        <span className="mt-1.5 inline-flex">
          <AdCta label={campaign.ctaLabel} color={campaign.color} size="sm" block />
        </span>
      </div>
    </ClickableAd>
  )
}

/** Encart inline dans le flux : miniature carrée + accroche + CTA compact. */
function InlineImageCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <ClickableAd campaign={campaign} onClick={onClick} className="flex items-center">
      <div className="relative h-20 w-24 shrink-0 md:w-28">
        <AdChip />
        <SmartImage
          src={campaign.imageUrl}
          alt=""
          fallbackColor={campaign.color}
          wrapperClassName="h-full w-full"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1 px-4 py-3">
        <BrandWordmark campaign={campaign} size="sm" />
        <p className="mt-1 truncate font-serif text-[15px] font-bold leading-snug tracking-tight md:text-base">
          {campaign.headline}
        </p>
      </div>
      <span className="mr-4 hidden shrink-0 md:inline-flex">
        <AdCta label={campaign.ctaLabel} color={campaign.color} size="sm" />
      </span>
    </ClickableAd>
  )
}

/** Billboard 970×250 : visuel plein cadre, voile marine, grand titre éditorial. */
function BillboardImageCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <ClickableAd
      campaign={campaign}
      onClick={onClick}
      className="flex min-h-[220px] items-end md:min-h-[260px]"
    >
      <AdChip />
      <SmartImage
        src={campaign.imageUrl}
        alt=""
        fallbackColor={campaign.color}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#071630]/95 via-[#071630]/60 to-transparent"
      />
      <div className="relative flex w-full max-w-2xl flex-col gap-2.5 p-6 md:p-9">
        <BrandWordmark campaign={campaign} light size="lg" />
        <p className="font-serif text-2xl font-black leading-[1.1] tracking-tight text-white md:text-[2rem]">
          {campaign.headline}
        </p>
        <p className="max-w-xl text-[13.5px] leading-relaxed text-white/80 md:text-sm">
          {campaign.body}
        </p>
        <span className="mt-2 inline-flex">
          <AdCta label={campaign.ctaLabel} color={campaign.color} size="lg" />
        </span>
      </div>
    </ClickableAd>
  )
}

/* -------------------------------------------------------------------------- */
/*                    Créas texte (auto-promo / sans visuel)                  */
/* -------------------------------------------------------------------------- */

function Monogram({
  campaign,
  size = "md",
}: {
  campaign: AdCampaignDto
  size?: "sm" | "md" | "lg"
}) {
  const sizeClass =
    size === "lg" ? "size-16 md:size-20" : size === "sm" ? "size-10" : "size-12"
  const textClass = size === "lg" ? "text-xl md:text-2xl" : size === "sm" ? "text-xs" : "text-sm"

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center font-serif font-bold text-white",
        sizeClass,
        textClass
      )}
      style={{ backgroundColor: campaign.color }}
    >
      {campaign.id === SELF_SERVE.id ? (
        <Megaphone className={size === "lg" ? "size-8" : "size-5"} />
      ) : (
        initialsOf(campaign.advertiser)
      )}
    </span>
  )
}

function CtaButton({
  campaign,
  onClick,
  compact,
}: {
  campaign: AdCampaignDto
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 border font-bold uppercase tracking-[0.13em] transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        compact ? "h-9 px-4 text-[11px]" : "h-10 px-5 text-xs",
        campaign.id === SELF_SERVE.id
          ? "border-brand-red bg-brand-red text-white hover:bg-brand-red/85"
          : "border-foreground/70 text-foreground hover:bg-foreground hover:text-background"
      )}
      style={
        campaign.id === SELF_SERVE.id ? undefined : { borderColor: campaign.color, color: campaign.color }
      }
      onMouseEnter={(event) => {
        if (campaign.id !== SELF_SERVE.id) {
          event.currentTarget.style.backgroundColor = campaign.color
          event.currentTarget.style.color = "#ffffff"
        }
      }}
      onMouseLeave={(event) => {
        if (campaign.id !== SELF_SERVE.id) {
          event.currentTarget.style.backgroundColor = ""
          event.currentTarget.style.color = ""
        }
      }}
    >
      {campaign.ctaLabel}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </button>
  )
}

function LeaderboardCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6">
      <Monogram campaign={campaign} />
      <div className="min-w-0 flex-1">
        <p className="kicker" style={{ color: campaign.color }}>
          {campaign.advertiser}
        </p>
        <p className="mt-1 font-serif text-base font-bold leading-snug tracking-tight md:text-lg">
          {campaign.headline}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {campaign.body}
        </p>
      </div>
      <CtaButton campaign={campaign} onClick={onClick} />
    </div>
  )
}

function SidebarCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <Monogram campaign={campaign} size="lg" />
      <div>
        <p className="kicker" style={{ color: campaign.color }}>
          {campaign.advertiser}
        </p>
        <p className="mt-1.5 font-serif text-lg font-bold leading-snug tracking-tight">
          {campaign.headline}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {campaign.body}
        </p>
      </div>
      <CtaButton campaign={campaign} onClick={onClick} />
    </div>
  )
}

function InlineCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <div className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:gap-5">
      <Monogram campaign={campaign} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: campaign.color }}>
          {campaign.advertiser}
        </p>
        <p className="mt-0.5 font-serif text-[15px] font-bold leading-snug tracking-tight">
          {campaign.headline}
        </p>
      </div>
      <CtaButton campaign={campaign} onClick={onClick} compact />
    </div>
  )
}

/** Bannière « top » : leaderboard compact, visible sans repousser l'éditorial. */
function TopCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <div className="flex flex-col gap-3 p-3.5 md:min-h-[60px] md:flex-row md:items-center md:gap-4 md:p-4">
      <Monogram campaign={campaign} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="kicker truncate" style={{ color: campaign.color }}>
          {campaign.advertiser}
        </p>
        <p className="mt-0.5 truncate font-serif text-[15px] font-bold leading-snug tracking-tight">
          {campaign.headline}
        </p>
      </div>
      <CtaButton campaign={campaign} onClick={onClick} compact />
    </div>
  )
}

/** Pavé « bottom » : leaderboard dense posé au-dessus du pied de page. */
function BottomCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <div className="flex flex-col gap-3.5 p-4 md:flex-row md:items-center md:gap-5 md:p-5">
      <Monogram campaign={campaign} />
      <div className="min-w-0 flex-1">
        <p className="kicker truncate" style={{ color: campaign.color }}>
          {campaign.advertiser}
        </p>
        <p className="mt-1 truncate font-serif text-base font-bold leading-snug tracking-tight">
          {campaign.headline}
        </p>
        <p className="mt-1 line-clamp-1 text-[13px] leading-relaxed text-muted-foreground">
          {campaign.body}
        </p>
      </div>
      <CtaButton campaign={campaign} onClick={onClick} compact />
    </div>
  )
}

/** Gratte-ciel latéral (rail gauche / droit) : colonne centrée haute de ~560 px. */
function RailCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <div className="flex min-h-[540px] flex-col items-center justify-between gap-8 px-5 py-8 text-center">
      <Monogram campaign={campaign} size="lg" />
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="kicker" style={{ color: campaign.color }}>
          {campaign.advertiser}
        </p>
        <p className="mt-2.5 font-serif text-base font-bold leading-snug tracking-tight md:text-lg">
          {campaign.headline}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {campaign.body}
        </p>
      </div>
      <CtaButton campaign={campaign} onClick={onClick} compact />
    </div>
  )
}

function BillboardCreative({
  campaign,
  onClick,
}: {
  campaign: AdCampaignDto
  onClick: () => void
}) {
  return (
    <div className="grid items-center gap-6 p-8 md:grid-cols-[auto_1fr_auto] md:gap-10 md:p-10">
      <Monogram campaign={campaign} size="lg" />
      <div className="min-w-0">
        <p className="kicker" style={{ color: campaign.color }}>
          {campaign.advertiser}
        </p>
        <p className="mt-2 font-serif text-xl font-bold leading-tight tracking-tight md:text-3xl">
          {campaign.headline}
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          {campaign.body}
        </p>
      </div>
      <CtaButton campaign={campaign} onClick={onClick} />
    </div>
  )
}

const CREATIVES: Record<
  AdSlotName,
  React.ComponentType<{ campaign: AdCampaignDto; onClick: () => void }>
> = {
  top: TopCreative,
  leaderboard: LeaderboardCreative,
  sidebar: SidebarCreative,
  "rail-left": RailCreative,
  "rail-right": RailCreative,
  inline: InlineCreative,
  billboard: BillboardCreative,
  bottom: BottomCreative,
}

/** Créas image : mêmes emplacements, rendu display premium. */
const IMAGE_CREATIVES: Record<
  AdSlotName,
  React.ComponentType<{ campaign: AdCampaignDto; onClick: () => void }>
> = {
  top: TopImageCreative,
  leaderboard: LeaderboardImageCreative,
  sidebar: SidebarImageCreative,
  "rail-left": RailImageCreative,
  "rail-right": RailImageCreative,
  inline: InlineImageCreative,
  billboard: BillboardImageCreative,
  bottom: LeaderboardImageCreative,
}

/** Hauteur réservée par le squelette de chargement, par emplacement. */
const SKELETON_MIN_HEIGHT: Partial<Record<AdSlotName, number>> = {
  top: 96,
  bottom: 96,
  "rail-left": 560,
  "rail-right": 560,
  sidebar: 260,
}

/** Bordure du conteneur : bandeaux pleine largeur → filets haut/bas, sinon cadre complet. */
const SLOT_BORDER: Record<AdSlotName, string> = {
  top: "border-y border-border",
  bottom: "border-y border-border",
  inline: "border-y border-border",
  leaderboard: "border border-border",
  sidebar: "border border-border",
  "rail-left": "border border-border",
  "rail-right": "border border-border",
  billboard: "border border-border",
}

/* -------------------------------------------------------------------------- */
/*                                AdSlot                                      */
/* -------------------------------------------------------------------------- */

const ROTATION_MS = 10_000

/** Mention légale « Publicité » : ligne centrée entre deux filets pleins. */
function AdLabel({ onDark }: { onDark: boolean }) {
  return (
    <p
      aria-hidden="true"
      className="mb-2 flex h-6 items-center gap-3"
    >
      <span className="h-px flex-1 bg-border" />
      <span
        className={cn(
          "text-[9px] font-bold uppercase leading-none tracking-[0.22em]",
          onDark ? "text-zinc-500" : "text-zinc-400"
        )}
      >
        Publicité
      </span>
      <span className="h-px flex-1 bg-border" />
    </p>
  )
}

export interface AdSlotProps {
  /** Emplacement demandé : filtre les campagnes compatibles. */
  slot: AdSlotName
  navigate: Navigate
  className?: string
  /** Désactive le conteneur large (quand le parent fournit déjà la largeur). */
  bare?: boolean
  /** Posé sur une bande marine : adapte la teinte du libellé « Publicité ». */
  onDark?: boolean
}

/**
 * Espace publicitaire éditorial : mention « Publicité », créa en rotation,
 * tracking des impressions et des clics (régie maison).
 */
export function AdSlot({ slot, navigate, className, bare = false, onDark = false }: AdSlotProps) {
  const containerClass = bare
    ? "w-full"
    : "mx-auto w-full max-w-7xl px-4 sm:px-6"
  const { campaigns, loading } = useAds()

  /**
   * Campagnes compatibles avec cet emplacement + créa inventaire en secours.
   * Les créas avec visuel (vrais display ads) passent devant les créas texte
   * afin d'afficher d'abord une véritable publicité dans chaque emplacement.
   */
  const candidates = React.useMemo(() => {
    const matched = campaigns.filter((campaign) => campaign.slots.includes(slot))
    const withVisual = matched.filter((campaign) => campaign.imageUrl)
    const textOnly = matched.filter((campaign) => !campaign.imageUrl)
    return [...withVisual, ...textOnly, SELF_SERVE]
  }, [campaigns, slot])

  const startIndex = React.useMemo(() => {
    // Départ déterministe parmi les créas visuelles (s'il y en a).
    const visualCount = candidates.reduce((n, c) => (c.imageUrl ? n + 1 : n), 0)
    return slotSeed(slot) % (visualCount > 0 ? visualCount : candidates.length)
  }, [slot, candidates])
  const [index, setIndex] = React.useState(startIndex)

  React.useEffect(() => {
    setIndex(startIndex)
  }, [startIndex])

  // Rotation douce entre les créas disponibles.
  React.useEffect(() => {
    if (candidates.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % candidates.length)
    }, ROTATION_MS)
    return () => window.clearInterval(id)
  }, [candidates.length])

  const campaign = candidates[Math.min(index, candidates.length - 1)]
  const isSelfServe = campaign.id === SELF_SERVE.id
  const hasVisual = Boolean(campaign.imageUrl)
  const Creative = hasVisual ? IMAGE_CREATIVES[slot] : CREATIVES[slot]

  // Impression : une seule fois par créa affichée (protégé contre StrictMode).
  const trackedRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (isSelfServe) return
    const key = `${campaign.id}:${slot}:${index}`
    if (trackedRef.current === key) return
    trackedRef.current = key
    void trackEvent({ campaignId: campaign.id, slot, type: "impression" })
  }, [campaign.id, isSelfServe, slot, index])

  const handleClick = React.useCallback(() => {
    if (!isSelfServe) {
      void trackEvent({ campaignId: campaign.id, slot, type: "click" })
    }
    navigate(parseCtaView(campaign.ctaView))
  }, [campaign, isSelfServe, navigate, slot])

  // Pendant le premier chargement, on réserve à peine la place du libellé.
  if (loading && campaigns.length === 0) {
    return (
      <aside aria-label="Espace publicitaire" className={cn(containerClass, className)}>
        <AdLabel onDark={onDark} />
        <div
          className={cn("animate-pulse bg-muted/30", SLOT_BORDER[slot])}
          style={{ minHeight: SKELETON_MIN_HEIGHT[slot] ?? 110 }}
        />
      </aside>
    )
  }

  return (
    <aside
      aria-label="Espace publicitaire"
      className={cn(containerClass, className)}
    >
      <AdLabel onDark={onDark} />
      <div className={cn("relative overflow-hidden bg-muted/20", SLOT_BORDER[slot])}>
        {/* Règle de couleur de la campagne (fil gauche) — créas texte uniquement */}
        {!hasVisual && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{ backgroundColor: campaign.color }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${campaign.id}-${slot}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Creative campaign={campaign} onClick={handleClick} />
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  )
}
