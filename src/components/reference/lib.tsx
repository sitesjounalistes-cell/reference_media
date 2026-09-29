"use client"

import * as React from "react"

import {
  AtSign,
  Clock,
  Cpu,
  Facebook,
  FlaskConical,
  HeartPulse,
  Instagram,
  Landmark,
  Leaf,
  Lightbulb,
  Linkedin,
  Mail,
  MapPin,
  Music2,
  Palette,
  Phone,
  Rss,
  TrendingUp,
  Twitter,
  Users,
  Youtube,
  type LucideIcon,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

/* ---------------------------------- fetch --------------------------------- */

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    let message = `Erreur ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // corps non JSON : on garde le message par défaut
    }
    const err = new Error(message) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return (await res.json()) as T
}

export interface AsyncState<T> {
  data: T | null
  error: string | null
  /** code HTTP de l’erreur, s’il y en a un (ex. 404) */
  status: number | null
  loading: boolean
  retry: () => void
}

/** Petit hook de récupération avec abort, états de chargement/erreur et retry. */
export function useFetch<T>(url: string | null): AsyncState<T> {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState<boolean>(Boolean(url))
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (!url) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setError(null)
    setStatus(null)
    fetchJson<T>(url, { signal: controller.signal })
      .then((result) => {
        if (!active) return
        setData(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active || (err instanceof Error && err.name === "AbortError")) return
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
        setStatus(typeof (err as { status?: number })?.status === "number" ? (err as { status: number }).status : null)
        setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [url, tick])

  const retry = React.useCallback(() => setTick((t) => t + 1), [])
  return { data, error, status, loading, retry }
}

/* ------------------------------ icônes métier ----------------------------- */

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  FlaskConical,
  Landmark,
  Cpu,
  HeartPulse,
  Palette,
  Users,
  TrendingUp,
  Leaf,
}

export function getCategoryIcon(icon: string | undefined | null): LucideIcon {
  return (icon && CATEGORY_ICONS[icon]) || Lightbulb
}

/* ------------------------- réseaux sociaux & annuaire ---------------------- */

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  x: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Music2,
  rss: Rss,
}

const SOCIAL_LABELS: Record<string, string> = {
  x: "X (Twitter)",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  rss: "Flux RSS",
}

/** Icône lucide d'un réseau social (fallback AtSign pour plateforme inconnue). */
export function getSocialIcon(platform: string | undefined | null): LucideIcon {
  return (platform && SOCIAL_ICONS[platform]) || AtSign
}

/** Libellé lisible d'un réseau social, ex. « X (Twitter) ». */
export function getSocialLabel(platform: string | undefined | null): string {
  if (platform && SOCIAL_LABELS[platform]) return SOCIAL_LABELS[platform]
  if (platform) return platform.charAt(0).toUpperCase() + platform.slice(1)
  return "Réseau social"
}

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  PHONE: Phone,
  EMAIL: Mail,
  ADDRESS: MapPin,
  HOURS: Clock,
}

/** Icône lucide d'un canal de contact de l'annuaire. */
export function getChannelIcon(type: string | undefined | null): LucideIcon {
  return (type && CHANNEL_ICONS[type]) || Mail
}

/** Lien cliquable d'un canal (mailto: / tel:), sinon null. */
export function channelHref(
  type: string | undefined | null,
  value: string
): string | null {
  if (type === "EMAIL") return `mailto:${value}`
  if (type === "PHONE") return `tel:${value.replace(/[^+0-9]/g, "")}`
  return null
}

/* -------------------------------- formats fr ------------------------------ */

/** 12400 → « 12,4 k » ; 950 → « 950 ». */
export function formatViews(views: number): string {
  if (views >= 1_000_000) {
    const m = views / 1_000_000
    return `${m.toFixed(1).replace(".", ",")} M`
  }
  if (views >= 1000) {
    const k = views / 1000
    const s = k >= 100 ? Math.round(k).toString() : k.toFixed(1).replace(".", ",")
    return `${s} k`
  }
  return views.toLocaleString("fr-FR")
}

/** ISO → « 12 janvier 2025 ». */
export function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMMM yyyy", { locale: fr })
  } catch {
    return ""
  }
}

/** ISO → « 12 janv. 2025 » (forme compacte pour les cartes). */
export function formatDateShort(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: fr })
  } catch {
    return ""
  }
}

/** « 6 » → « 6 min de lecture ». */
export function readMinutesLabel(minutes: number): string {
  return `${minutes} min de lecture`
}

/* ------------------------------ helpers couleur --------------------------- */

/** Applique une couleur hex avec opacité (ex. alpha("#1B5FD9", 0.15)). */
export function alpha(hex: string | undefined | null, opacity: number): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return `rgba(27, 95, 217, ${opacity})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
